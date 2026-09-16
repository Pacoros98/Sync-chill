import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResetPassword from "./reset-password";

const { sendPasswordResetEmailMock } = vi.hoisted(() => ({
  sendPasswordResetEmailMock: vi.fn(),
}));

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual<typeof import("firebase/auth")>("firebase/auth");
  return {
    ...actual,
    sendPasswordResetEmail: sendPasswordResetEmailMock,
  };
});

vi.mock("../firebase", () => ({
  auth: {},
  db: {},
}));

function renderResetPassword() {
  return render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );
}

describe("ResetPassword", () => {
  beforeEach(() => {
    sendPasswordResetEmailMock.mockReset();
  });

  it("sends a reset email and shows a confirmation message", async () => {
    sendPasswordResetEmailMock.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/if an account exists for that email/i)
    ).toBeInTheDocument();
    expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
      {},
      "person@example.com"
    );
  });

  it("shows the same confirmation even when the email is unregistered", async () => {
    sendPasswordResetEmailMock.mockRejectedValueOnce({
      code: "auth/user-not-found",
      name: "FirebaseError",
      message: "no user",
    });
    const user = userEvent.setup();
    renderResetPassword();

    await user.type(screen.getByLabelText("Email"), "nobody@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByText(/if an account exists for that email/i)
    ).toBeInTheDocument();
  });
});
