export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="it-notice it-notice--warn" role="alert">
      <h2 className="it-notice__title">Не удалось загрузить ленту</h2>
      <p className="it-notice__text">Сервер n8n не ответил или ответил с ошибкой. Проверьте соединение и попробуйте ещё раз.</p>
      <div className="it-notice__actions">
        <button className="it-btn it-btn--secondary" type="button" onClick={onRetry}>
          Повторить
        </button>
      </div>
    </section>
  );
}
