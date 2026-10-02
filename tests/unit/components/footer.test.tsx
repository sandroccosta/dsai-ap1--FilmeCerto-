import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Footer } from "@/components/layout/footer";

describe("Footer", () => {
  it("mostra o texto exato da atribuição ao TMDB", () => {
    render(<Footer />);
    expect(
      screen.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
    ).toBeInTheDocument();
  });

  it("mostra o logo do TMDB com link para o site", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "The Movie Database (TMDB)" });
    expect(link).toHaveAttribute("href", "https://www.themoviedb.org/");
    expect(screen.getByAltText("TMDB")).toBeInTheDocument();
  });

  it("aponta para a página de créditos", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Créditos e atribuições" })).toHaveAttribute(
      "href",
      "/sobre",
    );
  });
});
