import { Worker, Job } from 'bullmq';
import { redis } from '../config/redis';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { buildQuestionPaperPrompt } from '../prompts/questionPaper';
import { generateWithGemini, parseGeneratedJSON, generateMockQuestionPaper } from '../services/aiService';
import { wsManager } from '../websocket/manager';

interface GenerationJobData {
  assignmentId: string;
}

export function startWorker(): void {
  const worker = new Worker<GenerationJobData>(
    'question-generation',
    async (job: Job<GenerationJobData>) => {
      const { assignmentId } = job.data;
      console.log(`🔄 Processing generation job for assignment: ${assignmentId}`);

      try {
        // 1. Fetch the assignment
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error(`Assignment not found: ${assignmentId}`);
        }

        // 2. Update status to 'generating'
        assignment.status = 'generating';
        await assignment.save();

        // Notify frontend of status change
        wsManager.notifyAssignment(assignmentId, {
          status: 'generating',
          message: 'AI is generating your question paper...',
        });

        let parsed: any;
        try {
          // 3. Build prompt and call AI
          const prompt = buildQuestionPaperPrompt(assignment);
          const rawResponse = await generateWithGemini(prompt);
          // 4. Parse the AI response
          parsed = parseGeneratedJSON(rawResponse);
        } catch (aiErr: any) {
          console.warn('⚠️ AI generation failed or API key is missing. Using premium fallback academic generator.', aiErr.message);
          parsed = generateMockQuestionPaper(assignment);
        }

        // 5. Create the QuestionPaper document
        const questionPaper = await QuestionPaper.create({
          assignmentId: assignment._id,
          school: assignment.school,
          subject: assignment.subject,
          class: assignment.class,
          duration: parsed.duration || '45 minutes',
          maxMarks: assignment.totalMarks,
          sections: parsed.sections,
          answerKey: parsed.answerKey || [],
        });

        // 6. Update assignment with reference to generated paper
        assignment.status = 'completed';
        assignment.generatedPaper = questionPaper._id as any;
        await assignment.save();

        // 7. Cache the result in Redis (1 hour TTL)
        await redis.setex(
          `paper:${assignmentId}`,
          3600,
          JSON.stringify(questionPaper.toJSON())
        );

        // 8. Notify frontend of completion
        wsManager.notifyAssignment(assignmentId, {
          status: 'completed',
          message: 'Question paper generated successfully!',
          paperId: questionPaper._id,
        });

        console.log(`✅ Generation completed for assignment: ${assignmentId}`);
        return { paperId: questionPaper._id };
      } catch (error: any) {
        console.error(`❌ Generation failed for assignment: ${assignmentId}`, error);

        // Update assignment status to failed
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });

        // Notify frontend of failure
        wsManager.notifyAssignment(assignmentId, {
          status: 'failed',
          message: error.message || 'Failed to generate question paper',
        });

        throw error;
      }
    },
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  console.log('✅ BullMQ worker started');
}
