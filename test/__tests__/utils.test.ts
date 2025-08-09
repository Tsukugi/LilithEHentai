import { describe, expect, test } from "@jest/globals";

import { useLilithLog } from "../../src/utils/log";
import { RequestUtils } from "../../src/utils/request";

const debug = true;
const { log } = useLilithLog(debug);

describe("Lilith", () => {
    describe("Test Utils ", () => {
        const res = "https://a.com/b/c.png";
        test("sanitizeImageSrc", () => {
            const { sanitizeImageSrc } = RequestUtils;
            expect(sanitizeImageSrc("//a.com/b/c.png")).toBe(res);
            expect(sanitizeImageSrc("//a.com/b/c.jpg.png")).toBe(res);
            expect(sanitizeImageSrc("//a.com/b/c.jpg.png.jpg.png")).toBe(res);
            expect(sanitizeImageSrc("a.com/b/c.png")).toBe(res);
            expect(sanitizeImageSrc("http://a.com/b/c.png")).toBe(res);
            expect(sanitizeImageSrc("https://a.com/b/c.png")).toBe(res);
            log(res);
        });
        test("removeDuplicateExtensions", () => {
            const { removeDuplicateExtensions } = RequestUtils;
            expect(removeDuplicateExtensions("https://a.com/b/c.png")).toBe(
                res,
            );
            expect(removeDuplicateExtensions("https://a.com/b/c.jpg.png")).toBe(
                res,
            );
            expect(
                removeDuplicateExtensions("https://a.com/b/c.jpg.png.jpg.png"),
            ).toBe(res);
            log(res);
        });
    });
});
