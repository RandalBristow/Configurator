import { Router } from "express";
import { optionsRouter } from "./options";
import { variablesRouter } from "./variables";
import { optionListsRouter } from "./optionLists";
import { selectListItemsRouter } from "./selectListItems";
import { selectListGroupsRouter } from "./selectListGroups";
import { selectListPropertiesRouter } from "./selectListProperties";
import { selectListItemPropertiesRouter } from "./selectListItemProperties";
import { lookupTablesRouter } from "./lookupTables";

export const apiRouter = Router();

apiRouter.use("/options", optionsRouter);
apiRouter.use("/variables", variablesRouter);
apiRouter.use("/select-lists", optionListsRouter);
apiRouter.use("/select-list-items", selectListItemsRouter);
apiRouter.use("/select-list-groups", selectListGroupsRouter);
apiRouter.use("/select-list-properties", selectListPropertiesRouter);
apiRouter.use("/select-list-item-properties", selectListItemPropertiesRouter);
apiRouter.use("/lookup-tables", lookupTablesRouter);
