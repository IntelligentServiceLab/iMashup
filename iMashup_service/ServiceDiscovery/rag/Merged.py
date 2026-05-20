import os
import pandas as pd


def merge_csv_files(folder_path, output_file="merged_all.csv"):
    dfs = []

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".csv"):
                file_path = os.path.join(root, file)
                print(f"正在读取: {file_path}")
                df = pd.read_csv(file_path)
                dfs.append(df)

    if not dfs:
        print("未找到任何csv文件")
        return

    merged_df = pd.concat(dfs, ignore_index=True)
    print(f"合并完成，共{len(merged_df)}行数据")

    merged_df.to_csv(output_file, index=False, encoding="utf-8-sig")
    print(f"已保存为: {output_file}")


if __name__ == "__main__":
    target_folder = r"D:\mjh\EasyComposer\data\ServiceDiscovery\data\dataset\Detail"
    # 执行合并
    merge_csv_files(target_folder, output_file=r"D:\mjh\EasyComposer\data\ServiceDiscovery\data\dataset\Detail\Amerged_detail.csv")