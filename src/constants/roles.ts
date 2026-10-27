/**
 * Enum for user roles
 */
export enum UserRole {
  BUSINESS_ANALYST = 1,
  DESIGNER = 2,
  DEVELOPER = 3,
  TEST_ENGINEER = 4,
  DEVOPS_ENGINEER = 5,
  PROJECT_MANAGER = 6,
}

export const ROLE_NAMES = {
  [UserRole.BUSINESS_ANALYST]: "Business Analyst",
  [UserRole.DESIGNER]: "Designer",
  [UserRole.DEVELOPER]: "Developer",
  [UserRole.TEST_ENGINEER]: "Test Engineer",
  [UserRole.DEVOPS_ENGINEER]: "DevOps Engineer",
  [UserRole.PROJECT_MANAGER]: "Project Manager",
}
