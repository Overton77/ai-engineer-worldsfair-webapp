import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import { describe, expect, it } from "vitest";

import {
  extractLearningAssetText,
  inspectLearningAssetFile,
  readLearningAssetDeclarations,
  resolveLearningAssetPath,
  storagePathForLearningAsset,
} from "./learning-assets";

describe("learning asset helpers", () => {
  it("parses vault frontmatter asset declarations", () => {
    const assets = readLearningAssetDeclarations(
      {
        assets: [
          {
            id: "judge-calibration-paper",
            path: "./assets/judge-calibration.pdf",
            kind: "pdf",
            role: "source",
            extraction_required: true,
          },
          {
            id: "external-reference",
            external_url: "https://example.com/ref",
            title: "External Reference",
          },
        ],
      },
      "agent_orchestration",
      "agent-skills-101",
    );

    expect(assets).toMatchObject([
      {
        id: "judge-calibration-paper",
        slug: "agent_orchestration/agent-skills-101/judge-calibration-paper",
        provider: "supabase-storage",
        kind: "pdf",
        role: "source",
        extractionRequired: true,
      },
      {
        id: "external-reference",
        provider: "external-url",
        externalUrl: "https://example.com/ref",
        kind: "web",
        role: "supporting",
      },
    ]);
  });

  it("builds deterministic local and storage paths", () => {
    expect(
      resolveLearningAssetPath(
        join("vault", "01_buckets", "agent", "course", "modules", "intro", "module.md"),
        "./assets/guide.md",
      ),
    ).toEqual(
      expect.stringContaining(
        normalize(join("vault", "01_buckets", "agent", "course", "modules", "intro", "assets", "guide.md")),
      ),
    );

    expect(
      storagePathForLearningAsset(
        "agent_orchestration",
        "agent-skills-101",
        "guide",
        "guide.md",
      ),
    ).toBe(
      "course/agent_orchestration/modules/agent-skills-101/guide/guide.md",
    );
  });

  it("rejects local asset paths outside the module folder", () => {
    expect(() =>
      resolveLearningAssetPath(
        join("vault", "01_buckets", "agent", "course", "modules", "intro", "module.md"),
        "../other-module/private.md",
      ),
    ).toThrow("Learning asset path must stay under ./assets");
  });

  it("rejects duplicate ids, unsafe ids, absolute paths, and s3 declarations", () => {
    expect(() =>
      readLearningAssetDeclarations(
        {
          assets: [
            { id: "guide", path: "./assets/guide.md" },
            { id: "guide", path: "./assets/other.md" },
          ],
        },
        "agent_orchestration",
        "agent-skills-101",
      ),
    ).toThrow("Duplicate learning asset id");

    expect(() =>
      readLearningAssetDeclarations(
        { assets: [{ id: "../secret", path: "./assets/secret.md" }] },
        "agent_orchestration",
        "agent-skills-101",
      ),
    ).toThrow("Invalid assets[0].id");

    expect(() =>
      resolveLearningAssetPath(
        join("vault", "01_buckets", "agent", "course", "modules", "intro", "module.md"),
        join(tmpdir(), "secret.md"),
      ),
    ).toThrow("Learning asset path must be relative");

    expect(() =>
      readLearningAssetDeclarations(
        { assets: [{ id: "future-s3", provider: "s3", path: "./assets/file.md" }] },
        "agent_orchestration",
        "agent-skills-101",
      ),
    ).toThrow("S3 learning assets are supported by schema");
  });

  it("extracts text files and fails required unsupported files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "learning-assets-"));
    try {
      const textPath = join(dir, "guide.md");
      await writeFile(textPath, "# Guide\n\nUse the asset pipeline.");
      const textInspection = await inspectLearningAssetFile(textPath);
      await expect(
        extractLearningAssetText(textInspection, true),
      ).resolves.toMatchObject({
        status: "succeeded",
        text: "# Guide\n\nUse the asset pipeline.",
        error: null,
      });

      const binaryPath = join(dir, "slides.pdf");
      await writeFile(binaryPath, "%PDF-1.7");
      const binaryInspection = await inspectLearningAssetFile(binaryPath);
      await expect(
        extractLearningAssetText(binaryInspection, true),
      ).resolves.toMatchObject({
        status: "failed",
        text: null,
        error: "Text extraction is not implemented for slides.pdf",
      });
      await expect(
        extractLearningAssetText(binaryInspection, false),
      ).resolves.toMatchObject({
        status: "not_required",
        warning: "Text extraction is not implemented for slides.pdf",
      });
    } finally {
      await rm(dir, { force: true, recursive: true });
    }
  });
});
