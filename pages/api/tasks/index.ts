import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../prisma';
import { TaskData } from './type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { title, description, parentId, startAt, endAt, priority } = req.body.task as TaskData;

    if (!title || !startAt || !endAt) {
      return res.status(400).json({ message: 'title, startAt, endAt is required' });
    }

    try {
      const task = await prisma.task.create({
        data: {
          title,
          description,
          parentId,
          priority,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
        },
      });
      res.status(201).json({ message: 'succeeded', task });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'something wrong' });
    }
  } else if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const sq = req.query.sq;
    const isCompleted = req.query.isCompleted === 'true';

    try {
      const skip = (page - 1) * perPage;

      const mainTasks = await prisma.task.findMany({
        skip,
        take: perPage,
        where: {
          parentId: null,
          ...(sq && { title: { contains: sq as string, mode: 'insensitive' } }),
          completedAt: isCompleted ? { not: null } : undefined,
        },
        include: {
          children: true,
        },
        orderBy: isCompleted
          ? { completedAt: 'desc' } // Sort completed tasks by completedAt in descending order
          : [
              { completedAt: 'asc' },
              { priority: 'desc' },
              { updatedAt: 'desc' },
            ], // Sort incomplete tasks by priority, then updatedAt
      });

      const totalTasks = await prisma.task.count({
        where: {
          parentId: null,
          completedAt: isCompleted ? { not: null } : undefined,
        },
      });

      const totalPages = Math.ceil(totalTasks / perPage);

      return res.status(200).json({
        tasks: mainTasks,
        pagination: {
          totalCount: totalTasks,
          totalPages,
          currentPage: page,
          pageSize: perPage,
        },
      });
    } catch (error) {
      console.error('Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ message: 'something wrong' });
    }
  } else {
    res.status(405).json({ message: 'wrong method' });
  }
}
