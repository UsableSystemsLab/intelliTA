import Nav from "@/components/Landing-page/Nav";
import UserBadgesMaincontent from "@/components/Rewards/UserBadgesMaincontent";
import Footer from "@/components/shared/Footer";

export default function UserBadges({ user }) {
  return (
    <>
      <Nav user={user} />
      <div className="flex flex-col min-h-screen bg-transparent">
        <UserBadgesMaincontent />
        <Footer />
      </div>
    </>
  );
}
