import { useEffect, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
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
        title="Profile settings"
        description="Manage parent and child account access."
      />

      <div className="settings-page__grid">
        <Card className="settings-page__card" variant="glow">
          <div className="settings-page__header">
            <div>
              <p className="eyebrow">Parent profile</p>
              <h3>{parentProfile?.name || "Parent"}</h3>
              <p className="page-text">{parentProfile?.email || "No email saved"}</p>
            </div>
            <Badge tone="warm">Parent</Badge>
          </div>

          <div className="settings-page__form">
            <input
              type="password"
              placeholder="New parent password"
              value={parentPassword}
              onChange={(event) => setParentPassword(event.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm parent password"
              value={parentPasswordConfirm}
              onChange={(event) => setParentPasswordConfirm(event.target.value)}
            />
            {parentMessage ? <p className="parent-dashboard__message">{parentMessage}</p> : null}
            <Button onClick={handleUpdateParentPassword}>Update Parent Password</Button>
          </div>
        </Card>

        <Card className="settings-page__card" variant="soft">
          <div className="settings-page__header">
            <div>
              <p className="eyebrow">Child profile</p>
              <h3>{childProfile?.name || "No child profile"}</h3>
              <p className="page-text">
                {childProfile?.username ? `Username: ${childProfile.username}` : "Create a child profile first."}
              </p>
            </div>
            <Badge tone="mint">Child</Badge>
          </div>

          <div className="settings-page__form">
            <input
              type="password"
              placeholder="New child password"
              value={childPassword}
              onChange={(event) => setChildPassword(event.target.value)}
              disabled={!childProfile?.user_id}
            />
            <input
              type="password"
              placeholder="Confirm child password"
              value={childPasswordConfirm}
              onChange={(event) => setChildPasswordConfirm(event.target.value)}
              disabled={!childProfile?.user_id}
            />
            {childMessage ? <p className="parent-dashboard__message">{childMessage}</p> : null}
            <Button onClick={handleUpdateChildPassword} disabled={!childProfile?.user_id}>
              Update Child Password
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default Settings;
