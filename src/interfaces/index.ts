import {
    RepositoryBaseProps,
    ImageUriType,
    LilithLanguage,
} from "@atsu/lilith";
import { LilithRequest } from "./fetch";
import { UseDomParserImpl } from "./domParser";

export enum EHentaiImageExtension {
    j = "jpg",
    w = "webp",
    p = "png",
    g = "gif",
}

interface EHentaiPage {
    t: EHentaiImageExtension;
    w: number;
    h: number;
}

export interface EHentaiTag {
    id: number;
    type: string;
    name: string;
    url: string;
    count: number;
}

export interface EHentaiResult {
    id: number;
    media_id: string;
    title: {
        english: string;
        japanese: string;
        pretty: string;
    };
    images: {
        pages: EHentaiPage[];
        cover: EHentaiPage;
        thumbnail: EHentaiPage;
    };
    scanlator: string;
    upload_date: number;
    tags: EHentaiTag[];
    num_pages: number;
    num_favorites: number;
}

export interface EHentaiPaginateResult {
    result: EHentaiResult[];
    num_pages: number;
    per_page: number;
}

export enum EHentaiLanguage {
    english = "english",
    japanese = "japanese",
    chinese = "chinese",
}

export interface Domains {
    readonly baseUrl: string;
    readonly imgBaseUrl: string;
    readonly galleryBaseUrl: string;
}
export interface UseEHentaiMethodProps extends RepositoryBaseProps {
    domains: Domains;
    request: LilithRequest;
}

export interface GetImageUriProps {
    domains: Domains;
    mediaId: string;
    type: ImageUriType;
    imageExtension: EHentaiImageExtension;
    pageNumber?: number;
}

export enum EHentaiSort {
    RECENT = "recent",
    POPULAR_TODAY = "popular-today",
    POPULAR_WEEK = "popular-week",
    POPULAR = "popular",
}

export interface GetGalleriesProps {
    props: UseEHentaiMethodProps;
    document: UseDomParserImpl;
    requiredLanguages: LilithLanguage[];
    containerSelector?: string;
}
