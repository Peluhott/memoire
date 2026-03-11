import express from 'express';

declare global {
  namespace Express {
    // The shape of the authenticated user object we attach to req.user
    interface User {
      id: number;
      username?: string;
      email?: string;
      tokenVersion?: number;
      // optional fields useful in controllers
      limit_upload?: number;
      limit_connections?: number;
    }

    // Ensure Request.user is typed in this project
    interface Request {
      user?: User;
    }
  }
}

export {};
