import { render, screen } from "@testing-library/react";
import { HowItWorks } from "./HowItWorks";

describe("HowItWorks", () => {
  it("ссылается на репозиторий и экспорт workflow", () => {
    render(<HowItWorks />);
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://github.com/volkovidpm/personal_inbox_triage");
    expect(hrefs).toContain("https://github.com/volkovidpm/personal_inbox_triage/blob/main/n8n/classify.json");
  });

  it("объясняет, зачем две нейросети и как отсекается мусор", () => {
    render(<HowItWorks />);
    expect(screen.getByRole("heading", { name: "Почему две нейросети" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Как отсекается мусор" })).toBeTruthy();
  });

  it("не упоминает BRANDFREE — это делает только плашка", () => {
    const { container } = render(<HowItWorks />);
    expect(container.textContent).not.toMatch(/BRANDFREE/i);
  });
});
