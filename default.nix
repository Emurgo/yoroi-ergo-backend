{
 pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/e67c94a1adbb5cf8a0448bc9c434589b2dd293c2.tar.gz") {}
}:
with pkgs;
let
  packageJSON = builtins.fromJSON (builtins.readFile ./package.json);

  nix-npm-buildpackage = pkgs.fetchFromGitHub {
    owner = "Emurgo";
    repo = "nix-npm-buildpackage";
    rev = "abde678d1584af0ad00477486bca26c880963a70";
    sha256 = "sha256-apHZDERTGe+kdAPVnFltIZvtoMvuqjpm5lqpII+ZfHc=";
  };
in rec {
  inherit (pkgs.callPackage nix-npm-buildpackage {}) buildNpmPackage;

  yoroi-ergo-backend = buildNpmPackage {
    src = ./.;

    npmBuild = "npm run _flow-remove-types";
    postInstall = "cp -r flow-removed $out";

  };
}
