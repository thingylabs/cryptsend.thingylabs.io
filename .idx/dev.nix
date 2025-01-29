# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    # pkgs.go
    # pkgs.python311
    # pkgs.python311Packages.pip
    # pkgs.nodejs_20
    # pkgs.nodePackages.nodemon
    pkgs.nano
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "denoland.vscode-deno"
      "bradlc.vscode-tailwindcss"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Example: run "npm run dev" with PORT set to IDX's defined port for previews,
          # and show it in IDX's web preview panel
          command = ["/home/user/.deno/bin/deno" "run" "start"];
          manager = "web";
          env = {
            # Environment variables to set for your server
            PORT = "$PORT";
          };
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        deno-install = ''
          mkdir -p $HOME/.deno/bin
          curl -fsSL -o $HOME/.deno/deno.zip "https://github.com/denoland/deno/releases/download/v2.0.0/deno-x86_64-unknown-linux-gnu.zip"
          unzip -o $HOME/.deno/deno.zip -d $HOME/.deno/bin
          chmod +x $HOME/.deno/bin/deno
          rm $HOME/.deno/deno.zip
          echo 'export PATH="$PATH:$HOME/.deno/bin"' >> ~/.bashrc && source ~/.bashrc
        '';
      };
      # Runs when the workspace is (re)started
      onStart = {
      };
    };
  };
}
