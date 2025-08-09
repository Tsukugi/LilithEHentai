import {
    LilithError,
    SearchResult,
    BookBase,
    Search,
    SearchQueryOptions,
    UrlParamPair,
} from "@atsu/lilith";

import { UseEHentaiMethodProps } from "../interfaces";
import { useLilithLog } from "../utils/log";
import { PromiseTools } from "../utils/promise";
import { useRangeFinder } from "../utils/range";
import { DefaultSearchOptions, useEHentaiMethods } from "./base";
import { UseDomParserImpl } from "../interfaces/domParser";

/**
 * Custom hook for searching EHentai using the provided options and methods.
 *
 * @param {UseEHentaiMethodProps} options - The options and methods needed for EHentai search.
 * @returns {Search} - The search function.
 */
export const useEHentaiSearchMethod = (
    props: UseEHentaiMethodProps,
): Search => {
    const {
        domains: { baseUrl },
        options: { debug, requiredLanguages },
        request,
    } = props;
    const { getGalleries, EHentaiPageResultSize } = useEHentaiMethods();

    /**
     * Function for extracting the total number of pages
     *
     * @param {UseDomParserImpl} document - The parsed DOM document.
     * @returns {number} - The total number of pages.
     */
    const getTotalPages = (document: UseDomParserImpl): number => {
        // Extracting the last page anchor from the document
        const lastPageAnchor = document
            .find("section.pagination a.last")
            .getAttribute("href");

        // Handling case where the last page anchor is not found
        if (!lastPageAnchor) {
            throw new LilithError(
                404,
                "DOM Parser failed to find necessary elements needed for this process",
            );
        }

        // Extracting the page number from the last page anchor
        const pageNumberRegex = /page=(\d+)/;
        const match = lastPageAnchor.match(pageNumberRegex);

        // Returning the total number of pages (or defaulting to 1 if not found)
        return match ? +match[1] : 1;
    };

    /**
     * Internal function for generic EHentai search.
     *
     * @param {string} query - The search query.
     * @param {Partial<SearchQueryOptions>} options - Additional search options.
     * @returns {Promise<SearchResult>} - The search result.
     */
    const searchGeneric = async (
        query: string,
        options?: Partial<SearchQueryOptions>,
    ): Promise<SearchResult> => {
        const innerOptions: Partial<SearchQueryOptions> = {
            ...DefaultSearchOptions,
            ...options,
        };

        let args: UrlParamPair[] = [["f_search", query]];
        if (innerOptions.page > 1) {
            args = args.concat(["range", `${innerOptions.page}`]);
        }
        const response = await request(`${baseUrl}`, args);
        const document = await response.getDocument();

        const totalPages: number = getTotalPages(document);
        const books: BookBase[] = getGalleries({
            props,
            document,
            requiredLanguages,
        });

        useLilithLog(debug).log({
            totalPages,
            availableLanguages: books.map((book) => book.availableLanguages),
            uris: books.map((book) => book.cover.uri),
        });

        return {
            query: query,
            totalPages,
            page: innerOptions.page,
            totalResults: EHentaiPageResultSize * totalPages,
            results: books,
        };
    };

    /**
     * Main function for EHentai search, handling pagination and sequential search.
     *
     * @param {string} query - The search query.
     * @param {Partial<SearchQueryOptions>} options - Additional search options.
     * @returns {Promise<SearchResult>} - The search result.
     */
    return async (
        query: string,
        options?: Partial<SearchQueryOptions>,
    ): Promise<SearchResult> => {
        const innerOptions: SearchQueryOptions = {
            ...DefaultSearchOptions,
            ...options,
        };

        const { pageToRange, rangeToPagination } = useRangeFinder({
            pageSize: innerOptions.size,
        });

        const range = pageToRange(innerOptions.page);
        const pagination = rangeToPagination(range.startIndex, range.endIndex);
        let sequentialRes: SearchResult = { results: [] } as SearchResult;

        await PromiseTools.recursivePromiseChain({
            promises: new Array(pagination.length).fill(null).map(
                (_, index) => () =>
                    searchGeneric(query, {
                        ...innerOptions,
                        page: index + pagination[0],
                    }),
            ),
            numLevels: pagination.length,
            onPromiseSettled: async (result) => {
                sequentialRes = {
                    ...sequentialRes,
                    ...result,
                    results: [...sequentialRes.results, ...result.results],
                };
            },
        }).catch(console.error);

        return {
            ...sequentialRes,
            results: sequentialRes.results,
        };
    };
};
