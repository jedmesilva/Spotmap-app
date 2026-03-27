import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const getAdminClient = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

router.post("/upload/avatar", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }
  const token = authHeader.split(" ")[1];

  const { base64, mimeType } = req.body as { base64?: string; mimeType?: string };
  if (!base64 || !mimeType) {
    res.status(400).json({ error: "Missing base64 or mimeType" });
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(mimeType)) {
    res.status(400).json({ error: "Unsupported image type" });
    return;
  }

  const supabase = getAdminClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  const userId = userData.user.id;

  const buffer = Buffer.from(base64, "base64");

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (buffer.length > MAX_SIZE_BYTES) {
    res.status(413).json({ error: "Imagem muito grande. O tamanho máximo é 10MB." });
    return;
  }

  const ext = mimeType.split("/")[1];
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, { contentType: mimeType, upsert: true });

  if (uploadError) {
    logger.error({ uploadError }, "Storage upload failed");
    res.status(500).json({ error: uploadError.message });
    return;
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await supabase
    .from("users")
    .update({ avatar: avatarUrl })
    .eq("id", userId);

  if (dbError) {
    logger.error({ dbError }, "DB update failed");
    res.status(500).json({ error: dbError.message });
    return;
  }

  res.json({ url: avatarUrl });
});

export default router;
