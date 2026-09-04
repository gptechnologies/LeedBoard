import {
  BidSelectionPriority,
  CleanLevel,
  HomeCondition,
  JobCleanType,
  JobPriorityArea,
  JobRequestStatus,
  RoomType,
  ServiceNeed,
  UserRole,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/session";

type Params = Promise<{
  id: string;
}>;

const wholeHomeRooms = [
  RoomType.KITCHEN,
  RoomType.BATHROOM,
  RoomType.BEDROOM,
  RoomType.LIVING_AREA,
  RoomType.DINING_ROOM,
  RoomType.ENTRYWAY,
];

function parseEnumValue<T extends string>(
  value: FormDataEntryValue | null,
  enumValues: T[],
  fallback: T,
) {
  const raw = String(value || "").trim();
  return enumValues.includes(raw as T) ? (raw as T) : fallback;
}

function parseEnumList<T extends string>(values: FormDataEntryValue[], enumValues: T[]) {
  return values
    .map(String)
    .filter((value): value is T => enumValues.includes(value as T));
}

function parseSelectionPriority(value: FormDataEntryValue | null) {
  const priority = parseEnumValue(
    value,
    Object.values(BidSelectionPriority),
    BidSelectionPriority.BEST_QUALITY,
  );

  return priority === BidSelectionPriority.BEST_OVERALL
    ? BidSelectionPriority.BEST_QUALITY
    : priority;
}

function getJobShape(cleanType: JobCleanType, priorityAreas: JobPriorityArea[]) {
  const serviceNeeds = new Set<ServiceNeed>([
    ServiceNeed.GENERAL_CLEANING,
    ServiceNeed.KITCHEN,
    ServiceNeed.BATHROOMS,
    ServiceNeed.FLOORS,
    ServiceNeed.DUSTING,
  ]);
  const roomTypes = new Set<RoomType>(wholeHomeRooms);
  let cleanLevel: CleanLevel = CleanLevel.MEDIUM;

  if (cleanType === JobCleanType.DEEP_CLEAN) {
    cleanLevel = CleanLevel.DEEP;
    serviceNeeds.add(ServiceNeed.DEEP_CLEAN);
  }

  if (cleanType === JobCleanType.MOVE_OUT_CLEAN) {
    cleanLevel = CleanLevel.DEEP;
    serviceNeeds.add(ServiceNeed.MOVE_OUT);
    serviceNeeds.add(ServiceNeed.DEEP_CLEAN);
  }

  if (cleanType === JobCleanType.ASAP_REFRESH) {
    cleanLevel = CleanLevel.LIGHT;
  }

  if (priorityAreas.includes(JobPriorityArea.KITCHEN)) {
    serviceNeeds.add(ServiceNeed.KITCHEN);
    roomTypes.add(RoomType.KITCHEN);
  }

  if (priorityAreas.includes(JobPriorityArea.BATHROOMS)) {
    serviceNeeds.add(ServiceNeed.BATHROOMS);
    roomTypes.add(RoomType.BATHROOM);
  }

  if (priorityAreas.includes(JobPriorityArea.FLOORS)) {
    serviceNeeds.add(ServiceNeed.FLOORS);
  }

  if (
    priorityAreas.includes(JobPriorityArea.INSIDE_FRIDGE) ||
    priorityAreas.includes(JobPriorityArea.INSIDE_OVEN)
  ) {
    serviceNeeds.add(ServiceNeed.KITCHEN);
    roomTypes.add(RoomType.KITCHEN);
  }

  const roomCleanLevels = Object.fromEntries(
    Array.from(roomTypes).map((roomType) => [roomType, cleanLevel]),
  );

  return {
    cleanLevel,
    roomCleanLevels,
    roomTypes: Array.from(roomTypes),
    serviceNeeds: Array.from(serviceNeeds),
  };
}

export async function POST(request: Request, { params }: { params: Params }) {
  const user = await requireApiUser(request, UserRole.CUSTOMER);
  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const formData = await request.formData();
  const cleanType = parseEnumValue(
    formData.get("cleanType"),
    [JobCleanType.STANDARD_CLEAN, JobCleanType.DEEP_CLEAN, JobCleanType.MOVE_OUT_CLEAN],
    JobCleanType.STANDARD_CLEAN,
  );
  const currentCondition = parseEnumValue(
    formData.get("currentCondition"),
    Object.values(HomeCondition),
    HomeCondition.NORMAL_LIVED_IN,
  );
  const matchingPriorityAreas = parseEnumList(
    formData.getAll("matchingPriorityAreas"),
    Object.values(JobPriorityArea),
  );
  const selectionPriority = parseSelectionPriority(formData.get("selectionPriority"));
  const jobShape = getJobShape(cleanType, matchingPriorityAreas);

  await prisma.jobRequest.updateMany({
    where: {
      id,
      customerId: user.id,
      status: JobRequestStatus.OPEN,
    },
    data: {
      cleanType,
      currentCondition,
      matchingPriorityAreas,
      selectionPriority,
      ...jobShape,
    },
  });

  return NextResponse.redirect(new URL(`/customer/jobs/${id}?updated=1`, request.url));
}
