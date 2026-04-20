import {
  EntryMethod,
  PriorityType,
  RoomType,
  ServiceNeed,
  SuppliesSource,
} from "@prisma/client";

export const serviceNeedOptions: Array<{ value: ServiceNeed; label: string }> = [
  { value: ServiceNeed.GENERAL_CLEANING, label: "General cleaning" },
  { value: ServiceNeed.DEEP_CLEAN, label: "Deep clean" },
  { value: ServiceNeed.KITCHEN, label: "Kitchen" },
  { value: ServiceNeed.BATHROOMS, label: "Bathrooms" },
  { value: ServiceNeed.FLOORS, label: "Floors" },
  { value: ServiceNeed.DUSTING, label: "Dusting" },
  { value: ServiceNeed.MOVE_OUT, label: "Move out" },
  { value: ServiceNeed.WINDOWS, label: "Windows" },
  { value: ServiceNeed.LAUNDRY, label: "Laundry" },
];

export const roomTypeOptions: Array<{
  value: RoomType;
  label: string;
  icon: string;
}> = [
  { value: RoomType.KITCHEN, label: "Kitchen", icon: "Kitchen" },
  { value: RoomType.BATHROOM, label: "Bathroom", icon: "Bath" },
  { value: RoomType.BEDROOM, label: "Bedroom", icon: "Bed" },
  { value: RoomType.LIVING_AREA, label: "Living Area", icon: "Sofa" },
  { value: RoomType.OFFICE, label: "Office", icon: "Desk" },
  { value: RoomType.LAUNDRY, label: "Laundry", icon: "Laundry" },
];

export const priorityTypeOptions: Array<{ value: PriorityType; label: string }> = [
  { value: PriorityType.GENERAL_DUST, label: "General dust" },
  { value: PriorityType.DEEP_BATHROOM, label: "Deep clean bathroom" },
  { value: PriorityType.DEEP_KITCHEN, label: "Deep clean kitchen" },
  { value: PriorityType.FLOORS, label: "Floors and vacuuming" },
  { value: PriorityType.MOVE_OUT_TOUCHES, label: "Move-out touches" },
  { value: PriorityType.WINDOWS, label: "Windows" },
  { value: PriorityType.ORGANIZING, label: "Light organizing" },
];

export const roomPriorityMap: Record<RoomType, PriorityType[]> = {
  [RoomType.KITCHEN]: [PriorityType.DEEP_KITCHEN, PriorityType.GENERAL_DUST, PriorityType.ORGANIZING],
  [RoomType.BATHROOM]: [PriorityType.DEEP_BATHROOM, PriorityType.GENERAL_DUST],
  [RoomType.BEDROOM]: [PriorityType.GENERAL_DUST, PriorityType.ORGANIZING],
  [RoomType.LIVING_AREA]: [PriorityType.GENERAL_DUST, PriorityType.FLOORS, PriorityType.ORGANIZING],
  [RoomType.OFFICE]: [PriorityType.GENERAL_DUST, PriorityType.ORGANIZING],
  [RoomType.LAUNDRY]: [PriorityType.GENERAL_DUST, PriorityType.ORGANIZING],
};

export const entryMethodOptions: Array<{ value: EntryMethod; label: string }> = [
  { value: EntryMethod.HIDDEN_KEY, label: "Hidden key" },
  { value: EntryMethod.DOOR_CODE, label: "Door code" },
  { value: EntryMethod.BUZZ_IN, label: "Buzz me in" },
  { value: EntryMethod.I_WILL_BE_HOME, label: "I will be home" },
  { value: EntryMethod.FRONT_DESK, label: "Front desk" },
  { value: EntryMethod.OTHER, label: "Other" },
];

export const suppliesSourceOptions: Array<{ value: SuppliesSource; label: string }> = [
  { value: SuppliesSource.CLEANER_BRINGS_ALL, label: "Cleaner brings supplies" },
  { value: SuppliesSource.HOMEOWNER_PROVIDES, label: "I provide supplies" },
  { value: SuppliesSource.MIXED, label: "We will split it" },
];

export const etaOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" },
];

export const timeWindowOptions = [
  { start: "08:00", end: "11:00", label: "8:00 AM - 11:00 AM" },
  { start: "11:00", end: "14:00", label: "11:00 AM - 2:00 PM" },
  { start: "14:00", end: "17:00", label: "2:00 PM - 5:00 PM" },
  { start: "17:00", end: "20:00", label: "5:00 PM - 8:00 PM" },
];
