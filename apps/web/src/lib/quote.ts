export type Quote = {
	quotation: string;
	season: number;
	episode: number;
	episodeName: string;
};

export function episodeLabel(quote: Pick<Quote, 'season' | 'episode'>) {
	return `Season ${quote.season} · Episode ${quote.episode}`;
}
