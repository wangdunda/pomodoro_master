import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../prisma';
import { TaskData } from './type';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'task id is required' });
  }

  if (req.method === 'PUT') {
    const { title, description, parentId, startAt, endAt, completedAt, priority } = req.body as TaskData;

    if (!title || !startAt || !endAt) {
      return res.status(400).json({ message: 'title, startAt, endAt is required' });
    }

    try {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title,
          description,
          parentId,
          priority,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          completedAt: completedAt ? new Date(completedAt) : null,
        },
      });

      if (updatedTask.parentId) {
        const allChildrenCompleted = await prisma.task.findMany({
          where: { parentId: updatedTask.parentId, completedAt: null },
        });

        if (allChildrenCompleted.length === 0) {
          await prisma.task.update({
            where: { id: updatedTask.parentId },
            data: { completedAt: updatedTask.completedAt },
          });
        }
      }
      
      return res.status(200).json({ message: 'succeeded', task: updatedTask });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'something wrong' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.task.deleteMany({
        where: { parentId: id },
      });

      await prisma.task.delete({
        where: { id },
      });
      return res.status(200).json({ message: 'succeeded' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'something wrong' });
    }
  } else {
    return res.status(405).json({ message: 'wrong method' });
  }
}