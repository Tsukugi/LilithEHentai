import { beforeEach, describe, expect, test } from "@jest/globals";

import {
    RepositoryBase,
    BookListResults,
    Book,
    BookBase,
} from "@atsu/lilith";

import { headers } from "../nhentaiMock";
import { useCheerioDomParser } from "../../src/impl/useCheerioDomParser";

import { useNodeFetch } from "../../src/impl/useNodeFetch";
import { useLilithEHentai } from "../../src/index";
import { useLilithLog } from "../../src/utils/log";

const debug = true;
const { log } = useLilithLog(debug);

describe("Lilith", () => {
    describe("Test ehentai ", () => {
        let loader: RepositoryBase = {} as RepositoryBase;
        beforeEach(() => {
            loader = useLilithEHentai({
                headers,
                domParser: useCheerioDomParser,
                fetch: useNodeFetch,
                options: { debug },
            });
        });

        test("GetLatestBooks", async () => {
            const page: BookListResults = await loader.getLatestBooks(1);
            log(page);
            expect(page).toBeDefined();
        });

        test("getBook", async () => {
            const book: Book = await loader.getBook("3476777/85c392f692");
            log(book);
            expect(book).toBeDefined();
        });

        test("GetTrendingBooks", async () => {
            const books: BookBase[] = await loader.getTrendingBooks();
            log(books.map((result) => result.title));
            expect(books).toBeDefined();
            expect(books.length).toBeGreaterThan(0);
        });
        /* 
        test("Search", async () => {
            const search: SearchResult = await loader.search("dva");
            expect(search.results[0].cover.uri).toBeTruthy();
            expect(search).toBeDefined();
        });
        test("Search offset", async () => {
            const search4: SearchResult = await loader.search("English", {
                page: 4,
            });
            expect(search4).toBeDefined();
        });

        test("Supports webp", async () => {
            const book: Book = await loader.getBook("542733");
            const bookCoverExtension = book.cover.uri.split(".").slice(-1)[0];
            expect(bookCoverExtension).toBe("webp");
        });

        test("Doesn't have duplicate extensions", async () => {
            const books: BookBase[] = await loader.getTrendingBooks();

            // Function to check for duplicate extensions
            const hasDuplicateExtensions = (url: string): boolean => {
                const lastDotIndex = url.lastIndexOf(".");
                if (lastDotIndex !== -1) {
                    const extensions = url.slice(lastDotIndex).split(".");
                    const uniqueExtensions = new Set(extensions);
                    return uniqueExtensions.size < extensions.length; // If sizes differ, there are duplicates
                }
                return false; // No extensions found
            };

            // Assert that the book cover URL does not have duplicate extensions
            books.forEach((book) =>
                expect(hasDuplicateExtensions(book.cover.uri)).toBe(false),
            );
        });

        test("Has all extensions supported", async () => {
            const latestBooks: BookListResults = await loader.getLatestBooks(1);

            const extensions = latestBooks.results.map(
                (result) => result.cover.uri,
            );
            log(extensions);

            const undefinedExtensions = extensions.filter(
                (uri) => uri.split(".").slice(-1)[0] === undefined,
            );

            log(await fetch(extensions[0]));

            expect(undefinedExtensions.length).toBe(0);
        });
        */
    });
});
