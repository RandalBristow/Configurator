import { Router } from "express";
import { categoriesRouter } from "./categories";
import { subcategoriesRouter } from "./subcategories";
import { optionsRouter } from "./options";
import { attributesRouter } from "./attributes";
import { optionListsRouter } from "./optionLists";
import { selectListItemsRouter } from "./selectListItems";
import { selectListGroupsRouter } from "./selectListGroups";
import { selectListPropertiesRouter } from "./selectListProperties";
import { selectListItemPropertiesRouter } from "./selectListItemProperties";
import { lookupTablesRouter } from "./lookupTables";

export const apiRouter = Router();

apiRouter.use("/categories", categoriesRouter);
apiRouter.use("/subcategories", subcategoriesRouter);
apiRouter.use("/options", optionsRouter);
apiRouter.use("/attributes", attributesRouter);
apiRouter.use("/select-lists", optionListsRouter);
apiRouter.use("/select-list-items", selectListItemsRouter);
apiRouter.use("/select-list-groups", selectListGroupsRouter);
apiRouter.use("/select-list-properties", selectListPropertiesRouter);
apiRouter.use("/select-list-item-properties", selectListItemPropertiesRouter);
apiRouter.use("/lookup-tables", lookupTablesRouter);
