import type { Metadata } from "next";
import { ChooseCharacterRoute } from "@/components/character3d/ChooseCharacterRoute";

export const metadata: Metadata = {
  title: "Lingo - Select your Mentor",
};

const ChooseCharacterPage = () => <ChooseCharacterRoute />;

export default ChooseCharacterPage;
