import { useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import OpenMojiIcon from "../components/ui/OpenMojiIcon";
import PageHeader from "../components/ui/PageHeader";
import {
  getChildrenByParent,
  getParentProfile,
  updateChildPassword,
  updateParentPassword,
} from "../services";

function Settings() {
  const [parentProfile, setParentProfile] = useState(null);
  const [childProfile, setChildProfile] = useState(null);
  const [parentPassword, setParentPassword] = useState("");
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [childPasswordConfirm, setChildPasswordConfirm] = useState("");
  const [parentMessage, setParentMessage] = useState("");
  const [childMessage, setChildMessage] = useState("");
  const parentEmail =
    parentProfile?.email || localStorage.getItem("current_user_email") || "No email found";
  const childUsername =
    childProfile?.username || localStorage.getItem("current_user_username") || "No username found";

  useEffect(() => {
    async function loadSettingsProfiles() {
      const parentResult = await getParentProfile();
      const parentId = localStorage.getItem("current_user_id");
      const childrenResult = await getChildrenByParent(parentId);

      setParentProfile(parentResult.data || null);
      setChildProfile(childrenResult.data?.[0] || null);
    }

    loadSettingsProfiles();
  }, []);

  const handleUpdateParentPassword = async () => {
    setParentMessage("");

    if (!parentProfile?.user_id) {
      setParentMessage("Parent profile is not ready.");
      return;
    }

    if (!parentPassword || !parentPasswordConfirm) {
      setParentMessage("Enter and confirm the new password.");
      return;
    }

    if (parentPassword !== parentPasswordConfirm) {
      setParentMessage("Passwords do not match.");
      return;
    }

    const result = await updateParentPassword({
      parentId: parentProfile.user_id,
      password: parentPassword,
    });

    if (result.error) {
      setParentMessage(result.error);
      return;
    }

    setParentPassword("");
    setParentPasswordConfirm("");
    setParentMessage("Parent password updated.");
  };

  const handleUpdateChildPassword = async () => {
    setChildMessage("");

    if (!parentProfile?.user_id || !childProfile?.user_id) {
      setChildMessage("Child profile is not ready.");
      return;
    }

    if (!childPassword || !childPasswordConfirm) {
      setChildMessage("Enter and confirm the new password.");
      return;
    }

    if (childPassword !== childPasswordConfirm) {
      setChildMessage("Passwords do not match.");
      return;
    }

    const result = await updateChildPassword({
      parentId: parentProfile.user_id,
      childId: childProfile.user_id,
      password: childPassword,
    });

    if (result.error) {
      setChildMessage(result.error);
      return;
    }

    setChildPassword("");
    setChildPasswordConfirm("");
    setChildMessage("Child password updated.");
  };

  return (
    <section className="page-section settings-page">
      <PageHeader
        eyebrow="Settings"
        title="Account Settings"
        description="Update parent and child passwords."
      />

      <div className="settings-page__grid">
        <Card className="settings-page__card" variant="glow">
          <div className="settings-page__header">
            <div className="settings-page__account">
              <span className="settings-page__icon" aria-hidden="true">
                <OpenMojiIcon name="memo" />
              </span>
              <div>
                <p className="eyebrow">Parent</p>
                <h3>{parentProfile?.name || "Parent"}</h3>
                <p className="page-text">{parentEmail}</p>
              </div>
            </div>
            <Badge tone="warm">Parent</Badge>
          </div>

          <div className="settings-page__details" aria-label="Parent login details">
            <div>
              <span>Email</span>
              <strong>{parentEmail}</strong>
            </div>
            <div>
              <span>Password</span>
              <strong>********</strong>
            </div>
          </div>

          <div className="settings-page__form">
            <p className="settings-page__helper">Change the parent login password.</p>
            <input
              type="password"
              placeholder="New password"
              value={parentPassword}
              onChange={(event) => setParentPassword(event.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={parentPasswordConfirm}
              onChange={(event) => setParentPasswordConfirm(event.target.value)}
            />
            {parentMessage ? <p className="parent-dashboard__message">{parentMessage}</p> : null}
            <Button onClick={handleUpdateParentPassword}>
              <OpenMojiIcon name="check" className="settings-page__button-icon" />
              Save Password
            </Button>
          </div>
        </Card>

        <Card className="settings-page__card" variant="soft">
          <div className="settings-page__header">
            <div className="settings-page__account">
              <span className="settings-page__icon" aria-hidden="true">
                <OpenMojiIcon name="baby" />
              </span>
              <div>
                <p className="eyebrow">Child</p>
                <h3>{childProfile?.name || "No child profile"}</h3>
                <p className="page-text">
                  {childProfile?.user_id ? childUsername : "Create a child profile first."}
                </p>
              </div>
            </div>
            <Badge tone="mint">Child</Badge>
          </div>

          <div className="settings-page__details" aria-label="Child login details">
            <div>
              <span>Username</span>
              <strong>{childProfile?.user_id ? childUsername : "Not set"}</strong>
            </div>
            <div>
              <span>Password</span>
              <strong>{childProfile?.user_id ? "********" : "Not set"}</strong>
            </div>
          </div>

          <div className="settings-page__form">
            <p className="settings-page__helper">Change the child login password.</p>
            <input
              type="password"
              placeholder="New password"
              value={childPassword}
              onChange={(event) => setChildPassword(event.target.value)}
              disabled={!childProfile?.user_id}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={childPasswordConfirm}
              onChange={(event) => setChildPasswordConfirm(event.target.value)}
              disabled={!childProfile?.user_id}
            />
            {childMessage ? <p className="parent-dashboard__message">{childMessage}</p> : null}
            <Button onClick={handleUpdateChildPassword} disabled={!childProfile?.user_id}>
              <OpenMojiIcon name="check" className="settings-page__button-icon" />
              Save Password
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default Settings;
