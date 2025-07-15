import { clerkClient } from "@clerk/express";

export const auth = async (req, res, next) => {
  console.log("Auth middleware hit");

  try {
    const { userId, has } = await req.auth();
    const hasPremiumPlan = await has({ plan: 'premium' });

    const user = await clerkClient.users.getUser(userId);

    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: { free_usage: 0 },
      });
      req.free_usage = 0;
    }

    req.plan = hasPremiumPlan ? 'premium' : 'free';
    next();

  } catch (error) {
    if (!res.headersSent) {
      return res.status(401).json({ success: false, message: error.message });
    }
  }
};
