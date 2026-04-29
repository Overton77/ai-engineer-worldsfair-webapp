"use server";

import { revalidatePath } from "next/cache";

import { startCourse } from "@/lib/db/learn";

export async function startCourseAction(formData: FormData) {
  const courseId = formData.get("courseId");
  const courseSlug = formData.get("courseSlug");

  if (typeof courseId !== "string" || courseId.length === 0) {
    throw new Error("Missing course id.");
  }
  if (typeof courseSlug !== "string" || courseSlug.length === 0) {
    throw new Error("Missing course slug.");
  }

  await startCourse(courseId);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath("/learn");
}
