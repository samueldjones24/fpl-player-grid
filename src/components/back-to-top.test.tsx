// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackToTop } from "./back-to-top";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  cleanup();
  setScrollY(0);
});

describe("BackToTop", () => {
  it("is hidden until the page is scrolled past the threshold", async () => {
    render(<BackToTop />);
    expect(
      screen.queryByRole("button", { name: "Scroll back to top" }),
    ).not.toBeInTheDocument();

    setScrollY(500);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Scroll back to top" }),
      ).toBeInTheDocument();
    });
  });

  it("hides again once scrolled back above the threshold", async () => {
    render(<BackToTop />);
    setScrollY(500);
    window.dispatchEvent(new Event("scroll"));
    await screen.findByRole("button", { name: "Scroll back to top" });

    setScrollY(0);
    window.dispatchEvent(new Event("scroll"));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Scroll back to top" }),
      ).not.toBeInTheDocument();
    });
  });

  it("scrolls to the top when clicked", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;

    render(<BackToTop />);
    setScrollY(500);
    window.dispatchEvent(new Event("scroll"));
    const button = await screen.findByRole("button", {
      name: "Scroll back to top",
    });

    await user.click(button);

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
