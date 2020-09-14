{ pkgs ? import <nixpkgs> {} }:
with pkgs;

let
  packageJSON = builtins.fromJSON (builtins.readFile ./package.json);

  npm-to-nix = fetchFromGitHub {
    owner = "Emurgo";
    repo = "npm-to-nix";
    rev = "6d2cbbc9d58566513019ae176bab7c2aeb68efae";
    sha256 = "1wm9f2j8zckqbp1w7rqnbvr8wh6n072vyyzk69sa6756y24sni9a";
  };

in rec {

  inherit (callPackage npm-to-nix {}) npmToNix;

  yoroi-graphql-migration-backend = stdenv.mkDerivation rec {
    pname = "yoroi-ergo-backend";
    version = packageJSON.version;
    src = ./.;
    buildInputs = [ nodejs nodePackages.typescript ];

    preConfigure = ''
      cp -r ${npmToNix { inherit src; }} node_modules
      chmod -R +w node_modules
      patchShebangs node_modules
    '';

    buildPhase = ''
      export HOME=$TMPDIR
      npm install
      npm run _flow-remove-types
    '';

    installPhase = ''
      mkdir $out
      mv * $out
     
      mkdir -p $out/bin
      cat <<EOF > $out/bin/yoroi-ergo-backend
      #!${runtimeShell}
      exec ${nodejs}/bin/node $out/flow-removed/index.js
      EOF
      chmod +x $out/bin/yoroi-ergo-backend
    '';

    fixupPhase = ''
      patchShebangs $out
    '';
  };
}
