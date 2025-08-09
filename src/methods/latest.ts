import { GetLatestBooks, BookListResults } from "@atsu/lilith";
import { useLilithLog } from "../utils/log";
import { UseEHentaiMethodProps } from "../interfaces";
import { useEHentaiMethods } from "./base";

/**
 * Custom hook for fetching the latest EHentai books using the provided options and methods.
 *
 * @param {UseEHentaiMethodProps} props - The options and methods needed for EHentai latest book retrieval.
 * @returns {GetLatestBooks} - The function for fetching the latest books.
 */
export const useEHentaiGetLatestBooksMethod = (
    props: UseEHentaiMethodProps,
): GetLatestBooks => {
    const {
        domains: { baseUrl },
        options: { debug, requiredLanguages },
        request,
    } = props;

    const { getGalleries } = useEHentaiMethods();

    /**
     * Function for fetching the latest EHentai books for a specific page.
     *
     * @param {number} page - The page number for pagination.
     * @returns {Promise<BookListResults>} - The pagination result containing the latest books.
     */
    return async (page: number): Promise<BookListResults> => {
        const { log } = useLilithLog(debug);
        try {
            let args = [];
            if (page > 1) args = [["range", page]];
            const response = await request(`${baseUrl}`, args);
            const document = await response.getDocument();

            const galleries = getGalleries({
                props,
                document,
                requiredLanguages,
            });

            log({ galleries });
            return {
                page,
                results: galleries,
            };
        } catch (err) {
            console.error(err);
            return {
                page,
                results: [],
            };
        }
    };
};
