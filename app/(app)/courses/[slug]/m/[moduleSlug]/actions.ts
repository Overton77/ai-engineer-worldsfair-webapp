"use server";

import { revalidatePath } from "next/cache";

import { startCourse } from "@/lib/db/learn";

export async function startCourseFromModuleAction(formData: FormData) {
  const courseId = formData.get("courseId");
  const courseSlug = formData.get("courseSlug");
  const moduleSlug = formData.get("moduleSlug");

  if (typeof courseId !== "string" || courseId.length === 0) {
    throw new Error("Missing course id.");
  }
  if (typeof courseSlug !== "string" || courseSlug.length === 0) {
    throw new Error("Missing course slug.");
  }
  if (typeof moduleSlug !== "string" || moduleSlug.length === 0) {
    throw new Error("Missing module slug.");
  }

  await startCourse(courseId);
  revalidatePath(`/courses/${courseSlug}`);
  revalidatePath(`/courses/${courseSlug}/m/${moduleSlug}`);
  revalidatePath("/learn");
}
