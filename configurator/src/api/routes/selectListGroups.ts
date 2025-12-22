import { Router } from "express";
import { selectListGroupsService } from "../../services";
import { validate } from "../middleware/validate";
import {
  selectListIdParams,
  groupSetCreate,
  groupSetIdParams,
  groupSetUpdate,
  groupCreate,
  groupIdParams,
  groupUpdate,
  membershipBatch,
} from "../validators/selectListGroups";

export const selectListGroupsRouter = Router();

selectListGroupsRouter.get(
  "/:listId/group-sets",
  validate({ params: selectListIdParams }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const sets = await selectListGroupsService.listGroupSets(listId);
      res.json(sets);
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.post(
  "/:listId/group-sets",
  validate({ params: selectListIdParams, body: groupSetCreate }),
  async (req, res, next) => {
    try {
      const listId = req.params.listId as string;
      const created = await selectListGroupsService.createGroupSet(listId, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.put(
  "/:listId/group-sets/:setId",
  validate({ params: groupSetIdParams, body: groupSetUpdate }),
  async (req, res, next) => {
    try {
      const setId = req.params.setId as string;
      const updated = await selectListGroupsService.updateGroupSet(setId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.delete(
  "/:listId/group-sets/:setId",
  validate({ params: groupSetIdParams }),
  async (req, res, next) => {
    try {
      const setId = req.params.setId as string;
      await selectListGroupsService.deleteGroupSet(setId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.post(
  "/:listId/group-sets/:setId/groups",
  validate({ params: groupSetIdParams, body: groupCreate }),
  async (req, res, next) => {
    try {
      const setId = req.params.setId as string;
      const created = await selectListGroupsService.createGroup(setId, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.put(
  "/:listId/group-sets/:setId/groups/:groupId",
  validate({ params: groupIdParams, body: groupUpdate }),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      const updated = await selectListGroupsService.updateGroup(groupId, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.delete(
  "/:listId/group-sets/:setId/groups/:groupId",
  validate({ params: groupIdParams }),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      await selectListGroupsService.deleteGroup(groupId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.post(
  "/:listId/groups/:groupId/memberships",
  validate({ params: groupIdParams, body: membershipBatch }),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      await selectListGroupsService.setMemberships(groupId, req.body.itemIds ?? []);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

selectListGroupsRouter.get(
  "/:listId/groups/:groupId/memberships",
  validate({ params: groupIdParams }),
  async (req, res, next) => {
    try {
      const groupId = req.params.groupId as string;
      const memberships = await selectListGroupsService.listMemberships(groupId);
      res.json(memberships);
    } catch (err) {
      next(err);
    }
  },
);
