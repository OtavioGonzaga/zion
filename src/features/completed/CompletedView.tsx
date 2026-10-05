import { useEffect, useMemo, useState } from "react";
import { formatLocalDate, getCurrentLocalDate } from "../../domain/bible/date";
import { formatReferences } from "../../domain/bible/references";
import type { ChapterRef } from "../../domain/bible/types";
import type { ReadingPlan, CompletedChapter } from "../../domain/plan/types";
import { bibleBooks } from "../../data/bible-books";
import { SelectField } from "../../components/SelectField";
import { getCompletedBooks, groupCompletedByLocalDate, selectCompleted } from "./completed";

export function CompletedView({
	progress,
	plan,
	completed,
	onToggle,
	headingRef,
}: {
	progress: CompletedChapter[];
	plan: ReadingPlan;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
	headingRef?: React.RefObject<HTMLHeadingElement | null>;
}) {
	const [book, setBook] = useState("");
	const allItems = useMemo(() => selectCompleted(progress, plan), [progress, plan]);
	const items = useMemo(
		() => selectCompleted(progress, plan, book || undefined),
		[progress, plan, book],
	);
	const groups = groupCompletedByLocalDate(items);
	const books = getCompletedBooks(allItems);
	useEffect(() => {
		if (book && !books.includes(book)) setBook("");
	}, [book, books]);
	return (
		<section className="card completed-card" aria-labelledby="completed-heading">
			<div className="section-heading">
				<h1 className="plan-title" id="completed-heading" tabIndex={-1} ref={headingRef}>
					Concluídos
				</h1>
				<div className="completed-filter">
					<label className="sr-only" htmlFor="completed-book-filter">
						Filtrar por livro
					</label>
					<SelectField
						id="completed-book-filter"
						containerClassName="completed-book-select"
						value={book}
						onChange={(event) => setBook(event.target.value)}
					>
						<option value="">Todos os livros</option>
						{books.map((id) => (
							<option key={id} value={id}>
								{bibleBooks.find((book) => book.id === id)?.name ?? id}
							</option>
						))}
					</SelectField>
				</div>
			</div>
			{groups.length === 0 ? (
				<p className="muted">
					Nenhum capítulo concluído ainda.
					<br />
					As leituras marcadas como concluídas aparecerão aqui.
				</p>
			) : (
				groups.map(({ date, items: group }) => (
					<section
						className="completed-group"
						key={date}
						aria-label={date === getCurrentLocalDate() ? "Hoje" : formatLocalDate(date)}
					>
						<h2>
							{date === getCurrentLocalDate()
								? "Hoje"
								: formatLocalDate(date, { day: "2-digit", month: "long" })}
						</h2>
						<div className="completed-list">
							{group.map((item) => (
								<CompletedRow
									key={item.chapter}
									item={item}
									completed={completed}
									onToggle={onToggle}
								/>
							))}
						</div>
					</section>
				))
			)}
		</section>
	);
}

function CompletedRow({
	item,
	completed,
	onToggle,
}: {
	item: CompletedChapter;
	completed: Set<ChapterRef>;
	onToggle: (chapter: ChapterRef, checked: boolean) => void;
}) {
	const time = new Date(item.completedAt);
	return (
		<label className="reading-row completed-row">
			<input
				type="checkbox"
				checked={completed.has(item.chapter)}
				onChange={(event) => onToggle(item.chapter, event.target.checked)}
			/>
			<span>{formatReferences([item.chapter])}</span>
			<time dateTime={item.completedAt}>
				{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(time)}
			</time>
		</label>
	);
}
