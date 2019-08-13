import * as path from 'path';
import * as fs from 'fs';
/**
 * Remove directory recursively
 * @param {string} dir_path
 * @see https://stackoverflow.com/a/42505874/3027390
 */
export const rimraf = (dir_path: string) => {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(entry => {
      var entry_path = path.join(dir_path, entry);
      if (fs.lstatSync(entry_path).isDirectory()) {
        rimraf(entry_path);
      } else {
        fs.unlinkSync(entry_path);
      }
    });
    fs.rmdirSync(dir_path);
  }
};
