import { Request, Response } from 'express';
import { Assignment } from '../models/Assignment';
import { QuestionPaper } from '../models/QuestionPaper';
import { generationQueue } from '../jobs/queue';
import { redis } from '../config/redis';
import { z } from 'zod';

// Validation schema for assignment creation
const QuestionTypeSchema = z.object({
  type: z.string().min(1, 'Question type is required'),
  count: z.number().int().min(1, 'Count must be at least 1'),
  marks: z.number().int().min(1, 'Marks must be at least 1'),
});

const CreateAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required'),
  class: z.string().min(1, 'Class is required'),
  school: z.string().optional().default('Delhi Public School, Sector-4, Bokaro'),
  dueDate: z.string().min(1, 'Due date is required'),
  questionTypes: z.array(QuestionTypeSchema).min(1, 'At least one question type is required'),
  additionalInstructions: z.string().optional().default(''),
  totalQuestions: z.number().int().min(1, 'Total questions must be at least 1'),
  totalMarks: z.number().int().min(1, 'Total marks must be at least 1'),
});

export async function createAssignment(req: Request, res: Response): Promise<void> {
  try {
    const validation = CreateAssignmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const data = validation.data;

    // Create assignment in MongoDB
    const assignment = await Assignment.create({
      ...data,
      dueDate: new Date(data.dueDate),
      status: 'draft',
    });

    // Add job to BullMQ queue for AI generation
    await generationQueue.add('generate-paper', {
      assignmentId: assignment._id.toString(),
    });

    // Update status to show it's queued
    assignment.status = 'generating';
    await assignment.save();

    res.status(201).json({
      message: 'Assignment created and generation started',
      assignment,
    });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getAssignments(_req: Request, res: Response): Promise<void> {
  try {
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ assignments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getAssignment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id).lean();

    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json({ assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getQuestionPaper(req: Request, res: Response): Promise<void> {
  try {
    const { assignmentId } = req.params;

    // Check Redis cache first
    const cached = await redis.get(`paper:${assignmentId}`);
    if (cached) {
      res.json({ paper: JSON.parse(cached), source: 'cache' });
      return;
    }

    // Fallback to MongoDB
    const paper = await QuestionPaper.findOne({ assignmentId }).lean();

    if (!paper) {
      res.status(404).json({ error: 'Question paper not found' });
      return;
    }

    // Cache it for next time
    await redis.setex(`paper:${assignmentId}`, 3600, JSON.stringify(paper));

    res.json({ paper, source: 'database' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Delete associated question paper
    if (assignment.generatedPaper) {
      await QuestionPaper.findByIdAndDelete(assignment.generatedPaper);
      await redis.del(`paper:${id}`);
    }

    await Assignment.findByIdAndDelete(id);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function regeneratePaper(req: Request, res: Response): Promise<void> {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    // Delete existing paper
    if (assignment.generatedPaper) {
      await QuestionPaper.findByIdAndDelete(assignment.generatedPaper);
      await redis.del(`paper:${assignmentId}`);
    }

    // Reset status and re-queue
    assignment.status = 'generating';
    assignment.generatedPaper = undefined;
    await assignment.save();

    await generationQueue.add('generate-paper', {
      assignmentId: assignment._id.toString(),
    });

    res.json({ message: 'Regeneration started', assignment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
