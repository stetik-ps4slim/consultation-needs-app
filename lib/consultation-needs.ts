export type WeeklyScheduleEntry = {
  commitments: string;
  trainingTime: string;
  notes: string;
};

export type YesNo = "" | "Yes" | "No";

export type InvestmentRange = "$100-150" | "$150-250" | "$250-400+" | "";

export type ConsultationNeedsForm = {
  fullName: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  phoneNumber: string;
  emailAddress: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
  occupation: string;
  workSchedule: string;
  referredBy: string;
  consultationDate: string;
  goalWhat: string;
  goalWhere: string;
  goalWhy: string;
  goalWhen: string;
  feelAchieved: string;
  feelNotAchieved: string;
  needsToChange: string;
  needsFromCoach: string;
  commitmentLevel: string;
  commitmentWhy: string;
  pastHabits: string;
  otherConsiderations: string;
  weeklyInvestmentRange: InvestmentRange;
  investmentCloserTo: string;
  howLongWantedToStart: string;
  whatsStoppingYou: string;
  setBudget: string;
  daysAvailable: string;
  preferredTrainingTime: "" | "AM" | "PM";
  currentTrainingLevel: string;
  otherActivityStyles: string;
  likedBefore: string;
  dislikedBefore: string;
  favouriteStyles: string;
  favouriteWhy: string;
  leastFavourite: string;
  leastFavouriteWhy: string;
  idealSession: string;
  openToGroupTraining: YesNo;
  preferredSessionDuration: string;
  workedWithCoachBefore: YesNo;
  heartCondition: YesNo;
  chestPain: YesNo;
  dizziness: YesNo;
  asthmaAttack: YesNo;
  bloodSugarIssues: YesNo;
  otherConditionsAffectingExercise: YesNo;
  injuriesHistory: string;
  riskAge: string;
  riskGender: string;
  familyHistory: string;
  smokingStatus: YesNo;
  smokingAmount: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  waistCircumference: string;
  highBloodPressure: YesNo;
  highBloodPressureDetails: string;
  highCholesterol: YesNo;
  highCholesterolDetails: string;
  highBloodSugar: YesNo;
  highBloodSugarDetails: string;
  takingMedications: YesNo;
  medicationDetails: string;
  hospitalVisits: YesNo;
  hospitalVisitDetails: string;
  pregnancy: YesNo;
  muscleJointIssues: YesNo;
  muscleJointDetails: string;
  signOffName: string;
  signature: string;
  signOffDate: string;
  weeklySchedule: Record<string, WeeklyScheduleEntry>;
};

export type ConsultationNeedsRecord = {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  goal: string;
  consultation_date: string | null;
  form_data: ConsultationNeedsForm;
  created_at: string;
  updated_at: string;
};

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanYesNo(value: unknown): YesNo {
  return value === "Yes" || value === "No" ? value : "";
}

function cleanInvestmentRange(value: unknown): InvestmentRange {
  return value === "$100-150" || value === "$150-250" || value === "$250-400+"
    ? value
    : "";
}

function cleanTrainingTime(value: unknown): "" | "AM" | "PM" {
  return value === "AM" || value === "PM" ? value : "";
}

function cleanWeeklySchedule(value: unknown): Record<string, WeeklyScheduleEntry> {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  return Object.fromEntries(
    days.map((day) => {
      const entry = typeof record[day] === "object" && record[day] !== null
        ? (record[day] as Record<string, unknown>)
        : {};

      return [
        day,
        {
          commitments: cleanString(entry.commitments),
          trainingTime: cleanString(entry.trainingTime),
          notes: cleanString(entry.notes)
        }
      ];
    })
  ) as Record<string, WeeklyScheduleEntry>;
}

export function normalizeConsultationNeedsForm(input: Partial<ConsultationNeedsForm>) {
  return {
    fullName: cleanString(input.fullName),
    dateOfBirth: cleanString(input.dateOfBirth),
    age: cleanString(input.age),
    gender: cleanString(input.gender),
    phoneNumber: cleanString(input.phoneNumber),
    emailAddress: cleanString(input.emailAddress).toLowerCase(),
    emergencyContactName: cleanString(input.emergencyContactName),
    emergencyContactNumber: cleanString(input.emergencyContactNumber),
    occupation: cleanString(input.occupation),
    workSchedule: cleanString(input.workSchedule),
    referredBy: cleanString(input.referredBy),
    consultationDate: cleanString(input.consultationDate),
    goalWhat: cleanString(input.goalWhat),
    goalWhere: cleanString(input.goalWhere),
    goalWhy: cleanString(input.goalWhy),
    goalWhen: cleanString(input.goalWhen),
    feelAchieved: cleanString(input.feelAchieved),
    feelNotAchieved: cleanString(input.feelNotAchieved),
    needsToChange: cleanString(input.needsToChange),
    needsFromCoach: cleanString(input.needsFromCoach),
    commitmentLevel: cleanString(input.commitmentLevel),
    commitmentWhy: cleanString(input.commitmentWhy),
    pastHabits: cleanString(input.pastHabits),
    otherConsiderations: cleanString(input.otherConsiderations),
    weeklyInvestmentRange: cleanInvestmentRange(input.weeklyInvestmentRange),
    investmentCloserTo: cleanString(input.investmentCloserTo),
    howLongWantedToStart: cleanString(input.howLongWantedToStart),
    whatsStoppingYou: cleanString(input.whatsStoppingYou),
    setBudget: cleanString(input.setBudget),
    daysAvailable: cleanString(input.daysAvailable),
    preferredTrainingTime: cleanTrainingTime(input.preferredTrainingTime),
    currentTrainingLevel: cleanString(input.currentTrainingLevel),
    otherActivityStyles: cleanString(input.otherActivityStyles),
    likedBefore: cleanString(input.likedBefore),
    dislikedBefore: cleanString(input.dislikedBefore),
    favouriteStyles: cleanString(input.favouriteStyles),
    favouriteWhy: cleanString(input.favouriteWhy),
    leastFavourite: cleanString(input.leastFavourite),
    leastFavouriteWhy: cleanString(input.leastFavouriteWhy),
    idealSession: cleanString(input.idealSession),
    openToGroupTraining: cleanYesNo(input.openToGroupTraining),
    preferredSessionDuration: cleanString(input.preferredSessionDuration),
    workedWithCoachBefore: cleanYesNo(input.workedWithCoachBefore),
    heartCondition: cleanYesNo(input.heartCondition),
    chestPain: cleanYesNo(input.chestPain),
    dizziness: cleanYesNo(input.dizziness),
    asthmaAttack: cleanYesNo(input.asthmaAttack),
    bloodSugarIssues: cleanYesNo(input.bloodSugarIssues),
    otherConditionsAffectingExercise: cleanYesNo(input.otherConditionsAffectingExercise),
    injuriesHistory: cleanString(input.injuriesHistory),
    riskAge: cleanString(input.riskAge),
    riskGender: cleanString(input.riskGender),
    familyHistory: cleanString(input.familyHistory),
    smokingStatus: cleanYesNo(input.smokingStatus),
    smokingAmount: cleanString(input.smokingAmount),
    weightKg: cleanString(input.weightKg),
    heightCm: cleanString(input.heightCm),
    bmi: cleanString(input.bmi),
    waistCircumference: cleanString(input.waistCircumference),
    highBloodPressure: cleanYesNo(input.highBloodPressure),
    highBloodPressureDetails: cleanString(input.highBloodPressureDetails),
    highCholesterol: cleanYesNo(input.highCholesterol),
    highCholesterolDetails: cleanString(input.highCholesterolDetails),
    highBloodSugar: cleanYesNo(input.highBloodSugar),
    highBloodSugarDetails: cleanString(input.highBloodSugarDetails),
    takingMedications: cleanYesNo(input.takingMedications),
    medicationDetails: cleanString(input.medicationDetails),
    hospitalVisits: cleanYesNo(input.hospitalVisits),
    hospitalVisitDetails: cleanString(input.hospitalVisitDetails),
    pregnancy: cleanYesNo(input.pregnancy),
    muscleJointIssues: cleanYesNo(input.muscleJointIssues),
    muscleJointDetails: cleanString(input.muscleJointDetails),
    signOffName: cleanString(input.signOffName),
    signature: cleanString(input.signature),
    signOffDate: cleanString(input.signOffDate),
    weeklySchedule: cleanWeeklySchedule(input.weeklySchedule)
  } satisfies ConsultationNeedsForm;
}

export function buildConsultationNeedsInsert(form: Partial<ConsultationNeedsForm>) {
  const normalized = normalizeConsultationNeedsForm(form);

  return {
    client_name: normalized.fullName,
    client_email: normalized.emailAddress,
    client_phone: normalized.phoneNumber,
    goal: normalized.goalWhat,
    consultation_date: normalized.consultationDate || null,
    form_data: normalized
  };
}
