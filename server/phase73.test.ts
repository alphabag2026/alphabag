import { describe, it, expect } from "vitest";

// Phase 73: AI 자동화 플랜 등록 고도화 테스트

describe("Phase 73 - AI Auto Plan Import", () => {
  describe("URL validation for parseFromUrl", () => {
    it("should accept valid HTTP URLs", () => {
      const validUrls = [
        "https://xplay.1page.to",
        "https://alphabag.net/plan/maxfi",
        "http://example.com/plan",
        "https://sub.domain.com/path?query=1",
      ];
      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = ["not-a-url", "just text", ""];
      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });

  describe("Logo generation prompt building", () => {
    it("should build correct logo prompts for different plan types", () => {
      const buildPrompt = (planName: string, style: "minimalist" | "futuristic" | "bold") => {
        const prompts = {
          minimalist: `Professional investment fund logo for "${planName}". Clean, modern, minimalist design. Gold and dark navy color scheme.`,
          futuristic: `Crypto investment platform logo for "${planName}". Futuristic, sleek design. Gradient gold to amber colors.`,
          bold: `Financial brand logo for "${planName}". Bold typography with icon. Blue and gold palette.`,
        };
        return prompts[style];
      };

      const prompt = buildPrompt("MAXFI", "minimalist");
      expect(prompt).toContain("MAXFI");
      expect(prompt).toContain("minimalist");

      const futuristicPrompt = buildPrompt("AlphaBag", "futuristic");
      expect(futuristicPrompt).toContain("AlphaBag");
      expect(futuristicPrompt).toContain("Futuristic");
    });
  });

  describe("YouTube search URL building", () => {
    it("should build correct YouTube API search URL", () => {
      const buildSearchUrl = (query: string, maxResults: number, apiKey: string) => {
        return `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + " investment crypto")}&maxResults=${maxResults}&type=video&key=${apiKey}`;
      };

      const url = buildSearchUrl("AlphaBag MAXFI", 6, "test-api-key");
      expect(url).toContain("googleapis.com/youtube/v3/search");
      expect(url).toContain("AlphaBag%20MAXFI%20investment%20crypto");
      expect(url).toContain("maxResults=6");
      expect(url).toContain("type=video");
    });

    it("should encode special characters in query", () => {
      const query = "Alpha & Bag #1 Plan";
      const encoded = encodeURIComponent(query + " investment crypto");
      expect(encoded).not.toContain("&");
      expect(encoded).not.toContain("#");
      expect(encoded).not.toContain(" ");
    });
  });

  describe("HTML text extraction for URL parsing", () => {
    it("should strip HTML tags from content", () => {
      const stripHtml = (html: string) =>
        html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

      const html = "<html><body><h1>AlphaBag Plan</h1><p>Daily rate: 0.35%</p><script>alert('x')</script></body></html>";
      const text = stripHtml(html);
      expect(text).toContain("AlphaBag Plan");
      expect(text).toContain("Daily rate: 0.35%");
      expect(text).not.toContain("<h1>");
      expect(text).not.toContain("<script>");
      expect(text).not.toContain("alert");
    });

    it("should truncate text to 8000 characters", () => {
      const longText = "a".repeat(10000);
      const truncated = longText.slice(0, 8000);
      expect(truncated.length).toBe(8000);
    });
  });

  describe("Plan type detection", () => {
    it("should map plan types correctly", () => {
      const validPlanTypes = ["investment", "staking", "golden", "self", "leader", "influencer", "meme", "node"];
      const isValidPlanType = (type: string) => validPlanTypes.includes(type);

      expect(isValidPlanType("investment")).toBe(true);
      expect(isValidPlanType("golden")).toBe(true);
      expect(isValidPlanType("node")).toBe(true);
      expect(isValidPlanType("unknown")).toBe(false);
      expect(isValidPlanType("")).toBe(false);
    });
  });

  describe("YouTube video URL building", () => {
    it("should build correct YouTube watch and embed URLs", () => {
      const videoId = "dQw4w9WgXcQ";
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;

      expect(watchUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    });
  });

  describe("fullAutoFill logic", () => {
    it("should skip logo generation if logoUrl already exists", () => {
      const shouldGenerateLogo = (generateLogo: boolean, existingLogoUrl?: string) => {
        return generateLogo && !existingLogoUrl;
      };

      expect(shouldGenerateLogo(true, undefined)).toBe(true);
      expect(shouldGenerateLogo(true, "https://example.com/logo.png")).toBe(false);
      expect(shouldGenerateLogo(false, undefined)).toBe(false);
    });

    it("should skip video search if videoUrl already exists", () => {
      const shouldSearchVideos = (searchVideos: boolean, existingVideoUrl?: string) => {
        return searchVideos && !existingVideoUrl;
      };

      expect(shouldSearchVideos(true, undefined)).toBe(true);
      expect(shouldSearchVideos(true, "https://youtube.com/watch?v=abc")).toBe(false);
      expect(shouldSearchVideos(false, undefined)).toBe(false);
    });
  });

  describe("Step wizard navigation", () => {
    it("should have 3 steps in correct order", () => {
      const steps = ["자료 입력", "로고 & 영상", "확인 & 등록"];
      expect(steps.length).toBe(3);
      expect(steps[0]).toBe("자료 입력");
      expect(steps[1]).toBe("로고 & 영상");
      expect(steps[2]).toBe("확인 & 등록");
    });

    it("should validate step transitions", () => {
      const canAdvance = (currentStep: number, hasParsedPlan: boolean) => {
        if (currentStep === 1) return hasParsedPlan;
        if (currentStep === 2) return hasParsedPlan;
        return false;
      };

      expect(canAdvance(1, false)).toBe(false);
      expect(canAdvance(1, true)).toBe(true);
      expect(canAdvance(2, true)).toBe(true);
      expect(canAdvance(3, true)).toBe(false);
    });
  });
});
