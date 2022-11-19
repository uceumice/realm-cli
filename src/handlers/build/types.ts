export interface Config {
  name: string;
  private?: boolean;
  can_evaluate?: object;
  disable_arg_logs?: boolean;
  run_as_system?: boolean;
  run_as_user_id?: string;
  run_as_user_id_script_source?: string;
}

export interface FunctionConfig {
  exec?: {
    priv?: boolean;
    cond?: object;
    logs?: boolean;
  };
  auth?: 'sys' | string; // | (() => Promise<string>);
}

export type PackageFile = {
  dependencies: {
    [key in string]: string;
  };
};

export type ConfigFile = Config[];
