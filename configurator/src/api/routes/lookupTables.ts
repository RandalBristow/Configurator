import { Router } from "express";
import { lookupTablesService } from "../../services/lookupTablesService";
import { validate } from "../middleware/validate";
import {
  lookupTableColumnCreate,
  lookupTableColumnIdParams,
  lookupTableColumnUpdate,
  lookupTableCreate,
  lookupTableIdParams,
  lookupTableRowCreate,
  lookupTableRowIdParams,
  lookupTableRowUpdate,
  lookupTableRowsBulkCreate,
  lookupTableUpdate,
} from "../validators/lookupTables";

export const lookupTablesRouter = Router();

lookupTablesRouter.get("/", async (_req, res, next) => {
  try {
    const tables = await lookupTablesService.listTables();
    res.json(tables);
  } catch (err) {
    next(err);
  }
});

lookupTablesRouter.post(
  "/",
  validate({ body: lookupTableCreate }),
  async (req, res, next) => {
    try {
      const created = await lookupTablesService.createTable(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.put(
  "/:tableId",
  validate({ params: lookupTableIdParams, body: lookupTableUpdate }),
  async (req, res, next) => {
    try {
      const id = req.params.tableId as string;
      const updated = await lookupTablesService.updateTable(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.delete(
  "/:tableId",
  validate({ params: lookupTableIdParams }),
  async (req, res, next) => {
    try {
      const id = req.params.tableId as string;
      const deleted = await lookupTablesService.deleteTable(id);
      res.json(deleted);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.get(
  "/:tableId/columns",
  validate({ params: lookupTableIdParams }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const cols = await lookupTablesService.listColumns(tableId);
      res.json(cols);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.post(
  "/:tableId/columns",
  validate({ params: lookupTableIdParams, body: lookupTableColumnCreate }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const created = await lookupTablesService.createColumn(tableId, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.put(
  "/:tableId/columns/:columnId",
  validate({ params: lookupTableColumnIdParams, body: lookupTableColumnUpdate }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const columnId = req.params.columnId as string;
      const updated = await lookupTablesService.updateColumn(tableId, columnId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.delete(
  "/:tableId/columns/:columnId",
  validate({ params: lookupTableColumnIdParams }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const columnId = req.params.columnId as string;
      await lookupTablesService.deleteColumn(tableId, columnId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.get(
  "/:tableId/rows",
  validate({ params: lookupTableIdParams }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const rows = await lookupTablesService.listRows(tableId);
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.post(
  "/:tableId/rows",
  validate({ params: lookupTableIdParams, body: lookupTableRowCreate }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const created = await lookupTablesService.createRow(tableId, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.post(
  "/:tableId/rows/bulk",
  validate({ params: lookupTableIdParams, body: lookupTableRowsBulkCreate }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const result = await lookupTablesService.createRowsBulk(tableId, req.body.rows);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.put(
  "/:tableId/rows/:rowId",
  validate({ params: lookupTableRowIdParams, body: lookupTableRowUpdate }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const rowId = req.params.rowId as string;
      const updated = await lookupTablesService.updateRow(tableId, rowId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

lookupTablesRouter.delete(
  "/:tableId/rows/:rowId",
  validate({ params: lookupTableRowIdParams }),
  async (req, res, next) => {
    try {
      const tableId = req.params.tableId as string;
      const rowId = req.params.rowId as string;
      await lookupTablesService.deleteRow(tableId, rowId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);
