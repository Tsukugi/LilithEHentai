import { GetTrendingBooks, BookBase } from "@atsu/lilith";
import { UseEHentaiMethodProps } from "../interfaces";
import { useLilithLog } from "../utils/log";
import { useEHentaiMethods } from "./base";

/**
 * Custom hook for fetching the latest EHentai books using the provided options and methods.
 *
 * @param {UseEHentaiMethodProps} props - The options and methods needed for EHentai latest book retrieval.
 * @returns {GetTrendingBooks} - The function for fetching the latest books.
 */
export const useEHentaiGetTrendingBooksMethod = (
    props: UseEHentaiMethodProps,
): GetTrendingBooks => {
    const {
        domains: { baseUrl },
        options: { debug, requiredLanguages },
        request,
    } = props;

    const { getGalleries } = useEHentaiMethods();
    return async (): Promise<BookBase[]> => {
        try {
            const response = await request(`${baseUrl}/popular`);

            const document = await response.getDocument();

            const containerSelector = "table.itg.glte";

            const galleries = getGalleries({
                props,
                document,
                requiredLanguages,
                containerSelector,
            });

            useLilithLog(debug).log({ galleries });

            return galleries;
        } catch (error) {
            console.error(error);
            return [];
        }
    };
};
