import Nav from "@/components/Landing-page/Nav";
import RewardsMaincontent from "@/components/Rewards/RewardsMaincontent";
import Footer from "@/components/shared/Footer";

export default function Rewards({ user }) {
  return (
    <>
      <Nav user={user} />
      <div className="flex flex-col min-h-screen bg-transparent">
        <RewardsMaincontent user={user} />
        <Footer />
      </div>
    </>
  );
}
