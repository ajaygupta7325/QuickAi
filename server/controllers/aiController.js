import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary'
import FormData from "form-data";
import axios from 'axios';
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const freeUsage = req.free_usage;

    if (!prompt || !length) {
      return safeSend(400, {
        success: false,
        message: "Prompt and length are required.",
      });
    }

    if (plan !== "premium" && freeUsage <= 0) {
      return safeSend(403, {
        success: false,
        message: "Free usage limit exceeded. Please upgrade.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response?.choices?.[0]?.message?.content;

    if (!content) {
      return safeSend(500, {
        success: false,
        message: "AI failed to generate a valid response.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: {
          free_usage: freeUsage - 1,
        },
      });
    }

    return safeSend(200, { success: true, content });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};

export const generateBlogTitle = async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const freeUsage = req.free_usage;

    if (plan !== "premium" && freeUsage >= 10) {
      return safeSend(403, {
        success: false,
        message: "Free usage limit exceeded. Please upgrade.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response?.choices?.[0]?.message?.content;

    if (!content) {
      return safeSend(500, {
        success: false,
        message: "AI failed to generate a valid response.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    if (plan !== "premium") {
      await clerkClient.users.updateUser(userId, {
        privateMetadata: {
          free_usage: freeUsage + 1,
        },
      });
    }

    return safeSend(200, { success: true, content });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};


export const generateImage = async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;
    const freeUsage = req.free_usage;

    if (!prompt) {
      return safeSend(400, {
        success: false,
        message: "Prompt is required.",
      });
    }

    if (plan !== "premium" && freeUsage >= 10) {
      return safeSend(403, {
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const formData = new FormData();            // ✅ no conflict
    formData.append('prompt', prompt);

    const { data } = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      formData,
      {
        headers: {
          'x-api-key': process.env.CLIPDROP_API_KEY,
          ...formData.getHeaders(),             // ✅ required
        },
        responseType: 'arraybuffer',
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    if (!secure_url) {
      return safeSend(500, {
        success: false,
        message: "Image upload failed.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'Image', ${publish ?? false})
    `;

    return safeSend(200, { success: true, secure_url });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};

export const removeImageBackground= async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const image= req.file;
    const plan = req.plan;
    

    
    if (plan !== "premium" && freeUsage >= 10) {
      return safeSend(403, {
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    
    const { secure_url } = await cloudinary.uploader.upload(image.path,{
      transformation:[
        {
          effect : 'background_removal',
          background_removal:'remove_the_background'
        }
      ]
    });

    if (!secure_url) {
      return safeSend(500, {
        success: false,
        message: "Image upload failed.",
      });
    }

    await sql`
  INSERT INTO creations (user_id, prompt, content, type)
  VALUES (${userId}, ${'Remove background from image'}, ${secure_url}, 'image')
`


    return safeSend(200, { success: true, secure_url });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};


export const removeImageObject = async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (plan !== "premium" && freeUsage >= 10) {
      return safeSend(403, {
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: 'image'
    });

    if (!imageUrl) {
      return safeSend(500, {
        success: false,
        message: "Image generation failed.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Remove ${object} from image`}, ${imageUrl}, 'image')
    `;

    return safeSend(200, { success: true, secure_url: imageUrl });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};


export const resumeReview = async (req, res) => {
  let hasResponded = false;

  const safeSend = (status, body) => {
    if (!hasResponded && !res.headersSent) {
      hasResponded = true;
      return res.status(status).json(body);
    }
    console.warn("Attempted to send a response after headers were already sent.");
  };

  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;
    const freeUsage = req.free_usage ?? 0;

    if (plan !== "premium" && freeUsage >= 10) {
      return safeSend(403, {
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return safeSend(400, {
        success: false,
        message: "Resume file size exceeds allowed size (5MB)."
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    fs.unlinkSync(resume.path); // delete file after reading

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement.\n\nResume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",// or "gpt-3.5-turbo"
      message: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response?.choices?.[0]?.message?.content;

    if (!content) {
      return safeSend(500, {
        success: false,
        message: "AI response is empty. Check model name or prompt.",
      });
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    return safeSend(200, { success: true, content });

  } catch (error) {
    console.error("AI Generation Error:", error);
    return safeSend(500, {
      success: false,
      message: error.message || "Unexpected server error.",
    });
  }
};