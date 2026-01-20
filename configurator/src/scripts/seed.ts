import { prisma } from "../prisma/client";

async function main() {
  // Fixed IDs to keep seeds idempotent.
  const optionId = "00000000-0000-0000-0000-000000000333";
  const selectListId = "00000000-0000-0000-0000-000000000444";
  const optionListItem208Id = "00000000-0000-0000-0000-000000000445";
  const optionListItem480Id = "00000000-0000-0000-0000-000000000446";
  const globalVariableVoltageId = "00000000-0000-0000-0000-000000000555";
  const optionVariableHorsepowerId = "00000000-0000-0000-0000-000000000556";

  await prisma.selectList.upsert({
    where: { id: selectListId },
    update: {
      name: "VoltageLevels",
      description: "Available voltage options",
    },
    create: {
      id: selectListId,
      name: "VoltageLevels",
      description: "Available voltage options",
    },
  });

  await prisma.selectListItem.upsert({
    where: { id: optionListItem208Id },
    update: {
      selectListId: selectListId,
      value: "208",
      displayValue: "208V",
      order: 1,
      isActive: true,
    },
    create: {
      id: optionListItem208Id,
      selectListId: selectListId,
      value: "208",
      displayValue: "208V",
      order: 1,
      isActive: true,
    },
  });

  await prisma.selectListItem.upsert({
    where: { id: optionListItem480Id },
    update: {
      selectListId: selectListId,
      value: "480",
      displayValue: "480V",
      order: 2,
      isActive: true,
    },
    create: {
      id: optionListItem480Id,
      selectListId: selectListId,
      value: "480",
      displayValue: "480V",
      order: 2,
      isActive: true,
    },
  });

  await prisma.option.upsert({
    where: { id: optionId },
    update: {
      name: "Pump A",
      description: "Base pump option",
      isActive: true,
      optionType: "configured",
    },
    create: {
      id: optionId,
      name: "Pump A",
      description: "Base pump option",
      isActive: true,
      optionType: "configured",
    },
  });

  await prisma.variable.upsert({
    where: { id: globalVariableVoltageId },
    update: {
      optionId: null,
      ownerKey: "global",
      name: "global_voltage",
      description: "Default voltage level",
      dataType: "number",
      defaultValue: 480,
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: globalVariableVoltageId,
      optionId: null,
      ownerKey: "global",
      name: "global_voltage",
      description: "Default voltage level",
      dataType: "number",
      defaultValue: 480,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.variable.upsert({
    where: { id: optionVariableHorsepowerId },
    update: {
      optionId,
      ownerKey: optionId,
      name: "motor_hp",
      description: "Motor horsepower",
      dataType: "number",
      defaultValue: 10,
      sortOrder: 2,
      isActive: true,
    },
    create: {
      id: optionVariableHorsepowerId,
      optionId,
      ownerKey: optionId,
      name: "motor_hp",
      description: "Motor horsepower",
      dataType: "number",
      defaultValue: 10,
      sortOrder: 2,
      isActive: true,
    },
  });
}

main()
  .then(async () => {
    console.log("Seed completed.");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
