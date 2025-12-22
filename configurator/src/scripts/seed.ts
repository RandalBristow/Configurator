import { prisma } from "../prisma/client";

async function main() {
  // Fixed IDs to keep seeds idempotent.
  const categoryId = "00000000-0000-0000-0000-000000000111";
  const subcategoryId = "00000000-0000-0000-0000-000000000222";
  const optionId = "00000000-0000-0000-0000-000000000333";
  const optionListId = "00000000-0000-0000-0000-000000000444";
  const optionListItem208Id = "00000000-0000-0000-0000-000000000445";
  const optionListItem480Id = "00000000-0000-0000-0000-000000000446";
  const attributeVoltageId = "00000000-0000-0000-0000-000000000555";
  const attributeHorsepowerId = "00000000-0000-0000-0000-000000000556";

  await prisma.category.upsert({
    where: { id: categoryId },
    update: {
      name: "Pumps",
      description: "Pump stations",
      order: 1,
      isActive: true,
    },
    create: {
      id: categoryId,
      name: "Pumps",
      description: "Pump stations",
      order: 1,
      isActive: true,
    },
  });

  await prisma.subcategory.upsert({
    where: { id: subcategoryId },
    update: {
      categoryId,
      name: "Standard Pumps",
      description: "Standard pump configurations",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: subcategoryId,
      categoryId,
      name: "Standard Pumps",
      description: "Standard pump configurations",
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.selectList.upsert({
    where: { id: optionListId },
    update: {
      name: "VoltageLevels",
      description: "Available voltage options",
    },
    create: {
      id: optionListId,
      name: "VoltageLevels",
      description: "Available voltage options",
    },
  });

  await prisma.selectListItem.upsert({
    where: { id: optionListItem208Id },
    update: {
      selectListId: optionListId,
      value: "208",
      displayValue: "208V",
      order: 1,
      isActive: true,
    },
    create: {
      id: optionListItem208Id,
      selectListId: optionListId,
      value: "208",
      displayValue: "208V",
      order: 1,
      isActive: true,
    },
  });

  await prisma.selectListItem.upsert({
    where: { id: optionListItem480Id },
    update: {
      selectListId: optionListId,
      value: "480",
      displayValue: "480V",
      order: 2,
      isActive: true,
    },
    create: {
      id: optionListItem480Id,
      selectListId: optionListId,
      value: "480",
      displayValue: "480V",
      order: 2,
      isActive: true,
    },
  });

  await prisma.option.upsert({
    where: { id: optionId },
    update: {
      subcategoryId,
      code: "PUMP_A",
      name: "Pump A",
      description: "Base pump option",
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: optionId,
      subcategoryId,
      code: "PUMP_A",
      name: "Pump A",
      description: "Base pump option",
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.attribute.upsert({
    where: { id: attributeVoltageId },
    update: {
      optionId,
      key: "voltage",
      label: "Voltage",
      dataType: "enum",
      optionListId,
      sortOrder: 1,
      isActive: true,
    },
    create: {
      id: attributeVoltageId,
      optionId,
      key: "voltage",
      label: "Voltage",
      dataType: "enum",
      optionListId,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.attribute.upsert({
    where: { id: attributeHorsepowerId },
    update: {
      optionId,
      key: "motor_hp",
      label: "Motor HP",
      dataType: "number",
      defaultExpression: null,
      sortOrder: 2,
      isActive: true,
    },
    create: {
      id: attributeHorsepowerId,
      optionId,
      key: "motor_hp",
      label: "Motor HP",
      dataType: "number",
      defaultExpression: null,
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
