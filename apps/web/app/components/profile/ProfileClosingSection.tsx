"use client";

import { useState } from "react";
import type { DiraProfile } from "../../data/profile";

type ProfileClosingSectionProps = {
  profile: DiraProfile;
};

const connectionOptions = [
  "Professional collaboration",
  "Professional conversation",
  "Event / speaking",
  "Opportunity",
  "Introduction",
  "Other",
];

export default function ProfileClosingSection({
  profile,
}: ProfileClosingSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(connectionOptions[0]);
  const [message, setMessage] = useState("");

  return (
    <>
      <section className="profile-closeout" id="connect">
        <div className="profile-closeout__content">
          <p className="section-eyebrow">LET&apos;S CONNECT</p>

          <h2>Something here worth exploring?</h2>

          <p className="profile-closeout__text">
            Whether you&apos;re looking to collaborate, exchange ideas, invite this
            professional to speak, or simply start a conversation.
          </p>

          {profile.connection.enabled ? (
            <button
              type="button"
              className="profile-closeout__cta"
              onClick={() => setIsOpen(true)}
            >
              Connect with {profile.identity.name}
            </button>
          ) : null}
        </div>
      </section>

      {isOpen ? (
        <div className="profile-connection-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="profile-connection-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-connection-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-connection-modal__header">
              <div>
                <p className="section-eyebrow">CONNECT</p>
                <h3 id="profile-connection-title">Why would you like to connect?</h3>
              </div>

              <button
                type="button"
                className="profile-connection-modal__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close connection form"
              >
                ×
              </button>
            </div>

            <form
              className="profile-connection-form"
              onSubmit={(event) => {
                event.preventDefault();
                setIsOpen(false);
                setMessage("");
                setSelectedOption(connectionOptions[0]);
              }}
            >
              <div className="profile-connection-options" role="list">
                {connectionOptions.map((option) => (
                  <label key={option} className="profile-connection-option">
                    <input
                      type="radio"
                      name="connection-reason"
                      checked={selectedOption === option}
                      onChange={() => setSelectedOption(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>

              <label className="profile-connection-field">
                <span>Optional message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  placeholder="Briefly share the context, opportunity, or idea."
                />
              </label>

              <div className="profile-connection-actions">
                <button
                  type="button"
                  className="profile-connection-action profile-connection-action--secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-connection-action profile-connection-action--primary"
                >
                  Send request
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
