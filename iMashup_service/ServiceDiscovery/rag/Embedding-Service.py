import ast
import pandas as pd
import numpy as np
import faiss
import pickle
from sentence_transformers import SentenceTransformer

#拆解参数字段
import ast

def parse_param_field(param_str: str):
    """
    Parse parameter field into a list of dicts:
    [
        {"name": ..., "description": ...},
        ...
    ]
    """
    if not isinstance(param_str, str):
        return []

    try:
        data = ast.literal_eval(param_str)
    except Exception:
        return []

    if not data or data == [{}]:
        return []

    item = data[0]

    param_names = item.get("参数名", [])
    param_descs = item.get("参数注意事项", [])

    params = []
    for name, desc in zip(param_names, param_descs):
        params.append({
            "name": str(name).strip(),
            "description": str(desc).strip()
        })

    return params


# ======================
# 1. 读取 CSV
# ======================
def read_csv(detail_path,csv_name):
    csv_path = detail_path + csv_name
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["Endpoint描述"]).reset_index(drop=True)
    return df

# ======================
# 2. 构造用于向量化的文本
# ======================
def prepare_text(df):
    final_texts = []

    for _, row in df.iterrows():
        endpoint_name = row.get("Endpoint名称", "")
        raw_desc = row.get("Endpoint描述", "")
        endpoint_desc = ""
        if pd.notna(raw_desc):
            endpoint_desc = str(raw_desc).strip()
        required_params = parse_param_field(row.get("Endpoint必须参数", ""))
        optional_params = parse_param_field(row.get("Endpoint可选参数", ""))

        sentences = []
        # 0. 服务名称
        if endpoint_name:
            sentences.append(
                f"This service is named: {endpoint_name}."
            )
        else:
            sentences.append(
                f"This service does not have a name."
            )
        # 1. 服务功能描述
        if endpoint_desc:
            sentences.append(
                f"This service offers the following functional description: {endpoint_desc}."
            )
        else:
            sentences.append(
                "This service does not provide a functional description."
            )

        # 2. 必选参数
        if required_params:
            sentences.append(
                f"This service has {len(required_params)} required input parameter(s)."
            )
            for i, param in enumerate(required_params, 1):
                name = param.get("name", "unknown")
                desc = param.get("description")

                if desc and str(desc).strip().lower() != "nan":
                    sentences.append(
                        f"The No.{i} required parameter is named \"{name}\", "
                        f"and its description is: {desc}."
                    )
                else:
                    sentences.append(
                        f"The No.{i} required parameter is named \"{name}\", "
                        f"but no detailed description is provided."
                    )
        else:
            sentences.append(
                "This service does not have any required input parameters."
            )

        # 3. 可选参数
        if optional_params:
            sentences.append(
                f"This service has {len(optional_params)} optional parameter(s)."
            )
            for i, param in enumerate(optional_params, 1):
                name = param.get("name", "unknown")
                desc = param.get("description")

                if desc and str(desc).strip().lower() != "nan":
                    sentences.append(
                        f"The No.{i} optional parameter is named \"{name}\", "
                        f"and its description is: {desc}."
                    )
                else:
                    sentences.append(
                        f"The No.{i} optional parameter is named \"{name}\", "
                        f"but no detailed description is provided."
                    )
        else:
            sentences.append(
                "This service does not have any optional input parameters."
            )

        # 4. 合并
        combined_text = " ".join(sentences)
        final_texts.append(combined_text)

    print(final_texts)
    return final_texts

# ======================
# 3. 向量化
# ======================
def vectorizing(model_path,final_texts):
    # model_path = "D:/cache/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
    model = SentenceTransformer(model_path)
    embeddings = model.encode(
        final_texts,
        batch_size=32,#批处理大小
        show_progress_bar=True #UI向量化进度条
    )
    embeddings = np.array(embeddings).astype("float32")
    faiss.normalize_L2(embeddings)
    return embeddings

# ======================
# 4. 构建Faiss索引
# ======================
def faiss_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    return index

# ======================
# 5. 保存索引 & 元数据
# ======================
def save_data(local_library_path,index_filename,pkl_filename,index,df):
    index_path = local_library_path + index_filename
    pkl_path = local_library_path + pkl_filename
    faiss.write_index(index, index_path)
    with open(pkl_path, "wb") as f:
        pickle.dump(df.to_dict(orient="records"), f)
    print(f"✅ 已向量化 {len(df)} 条 endpoint")

def main():
    # ======================
    # 路径配置
    # ======================
    root_directory = "D:/mjh/EasyComposer/data/ServiceDiscovery/"#项目根路径
    detail_path = root_directory + "data/dataset/Detail/"
    csv_name = "Amerged_detail.csv" #根据实际修改
    model_path = "D:/mjh/EasyComposer/data/models--sentence-transformers--all-MiniLM-L6-v2/snapshots\c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
    local_library_path = root_directory + "data/Local_library/"
    index_filename = "Amerged_detail_NL.index"
    pkl_filename = "Amerged_detail_meta_NL.pkl"
    # ======================
    # 1. 读取 CSV
    # ======================
    df = read_csv(detail_path, csv_name)
    # ======================
    # 2. 构造文本
    # ======================
    final_texts = prepare_text(df)
    # ======================
    # 3. 向量化
    # ======================
    embeddings = vectorizing(model_path, final_texts)
    # ======================
    # 4. 构建 FAISS 索引
    # ======================
    index = faiss_index(embeddings)
    # ======================
    # 5. 保存索引 & 元数据
    # ======================
    save_data(local_library_path,index_filename, pkl_filename, index, df)
    print("🎉 向量库构建完成")

if __name__ == "__main__":
    main()
