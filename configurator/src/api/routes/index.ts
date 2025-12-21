import { Router } from "express";
import { categoriesRouter } from "./categories";
import { subcategoriesRouter } from "./subcategories";
import { optionsRouter } from "./options";
import { attributesRouter } from "./attributes";
import { optionListsRouter } from "./optionLists";
import { optionListItemsRouter } from "./optionListItems";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/subcategories", subcategoriesRouter);
apiRouter.use("/options", optionsRouter);
apiRouter.use("/attributes", attributesRouter);
apiRouter.use("/option-lists", optionListsRouter);
apiRouter.use("/option-list-items", optionListItemsRouter);
