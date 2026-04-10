import { useEffect, useState } from "react";

export const usePagination = <T,>(items: T[], reviewsPerPage: number) => {
    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);

    const totalPages = Math.max(1, Math.ceil(items.length / reviewsPerPage));
    const paginatedItems = items.slice(
        (currentPage - 1) * reviewsPerPage,
        currentPage * reviewsPerPage
    );

    // Whenever the filtered reviews or pagination settings change,
    // reset to first page if current page would be out of range
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [items, reviewsPerPage, totalPages, currentPage]);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems
    };
};