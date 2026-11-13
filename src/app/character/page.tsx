import type { Metadata } from "next";
import { CharacterViewer } from "@/components/character3d/CharacterViewer";

export const metadata: Metadata = {
  title: "Lingo - 3D character",
};

const CharacterPage = () => <CharacterViewer />;

export default CharacterPage;
