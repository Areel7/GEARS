import { Router } from "express";
import { createContentController } from "../controllers/contentController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage, uploadTeamImages } from "../middleware/upload.js";

/*
  Builds a protected CRUD router for one content resource.
  Resources with two images (core-team style) use the multi-field
  uploader; the rest use a single "image" field.
*/
export const createContentRouter = (config) => {
  const controller = createContentController(config);

  const router = Router();

  router.use(requireAuth);

  const upload =
    config.imageFields.length > 1
      ? uploadTeamImages
      : uploadImage.single(config.imageFields[0]?.name || "image");

  router.get("/", controller.list);
  router.post("/", upload, controller.create);

  /* Declared before "/:id" so "reorder" is not read as an id. */
  router.patch("/reorder", controller.reorder);

  router.get("/:id", controller.getOne);
  router.put("/:id", upload, controller.update);
  router.patch("/:id", upload, controller.update);
  router.delete("/:id", controller.remove);

  return router;
};
