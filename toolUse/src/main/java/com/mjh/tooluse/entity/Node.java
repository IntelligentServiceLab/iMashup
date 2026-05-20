package com.mjh.tooluse.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.net.http.HttpResponse;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Node {
    private String id;
    private String type;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Position position;

    private String targetPosition;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Data data;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Measured measured;

    private boolean selected;
    private boolean dragging;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Position getPosition() {
        return position;
    }

    public void setPosition(Position position) {
        this.position = position;
    }

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public Measured getMeasured() {
        return measured;
    }

    public void setMeasured(Measured measured) {
        this.measured = measured;
    }

    public boolean isSelected() {
        return selected;
    }

    public void setSelected(boolean selected) {
        this.selected = selected;
    }

    public boolean isDragging() {
        return dragging;
    }

    public void setDragging(boolean dragging) {
        this.dragging = dragging;
    }

    public String getTargetPosition() {
        return targetPosition;
    }

    public void setTargetPosition(String targetPosition) {
        this.targetPosition = targetPosition;
    }

    //    @Override
//    public String toString() {
//        return "{" +
//                "id:'" + id + '\'' +
//                ", type:'" + type + '\'' +
//                ", " + position +
//                ", " + data +
//                ", " + measured +
//                '}';
//    }


    @Override
    public String toString() {
        return "{" +
                "id:'" + id + '\'' +
                ", type:'" + type + '\'' +
                ", " + position +
                ", targetPosition:'" + targetPosition + '\'' +
                ", " + data +
                ", " + measured +
                ", selected:" + selected +
                ", dragging:" + dragging +
                '}';
    }

    public static class Position {
        private Double x;
        private Double y;

        public Double getX() {
            return x;
        }

        public void setX(Double x) {
            this.x = x;
        }

        public Double getY() {
            return y;
        }

        public void setY(Double y) {
            this.y = y;
        }

        @Override
        public String toString() {
            return "position:{" +
                    "x:" + x +
                    ", y:" + y +
                    '}';
        }
    }

    public static class Data {
        private String label;
        private String name;
        private List<Input> inputs;
        private List<Output> outputs;
        private String urlLine;
        private String urlHeader;
        private String method;

        public String getUrlHeader() {
            return urlHeader;
        }

        public void setUrlHeader(String urlHeader) {
            this.urlHeader = urlHeader;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public List<Input> getInputs() {
            return inputs;
        }

        public void setInputs(List<Input> inputs) {
            this.inputs = inputs;
        }

        public List<Output> getOutputs() {
            return outputs;
        }

        public void setOutputs(List<Output> outputs) {
            this.outputs = outputs;
        }

        public String getUrlLine() {
            return urlLine;
        }

        public void setUrlLine(String urlLine) {
            this.urlLine = urlLine;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        @Override
        public String toString() {
            return "data:{" +
                    "label:'" + label + '\'' +
                    ", name:'" + name + '\'' +
                    "," + inputs +
                    "," + outputs +
                    ", urlLine='" + urlLine + '\'' +
                    ", urlHeader='" + urlHeader + '\'' +
                    ", method='" + method + '\'' +
                    '}';
        }

        public static class Input {
            private String key;
            private String name;
            private String type;
            private String text;
            private String isFold;

            @TableField(typeHandler = JacksonTypeHandler.class)
            private Value value;

            public String getKey() {
                return key;
            }

            public void setKey(String key) {
                this.key = key;
            }

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public String getText() {
                return text;
            }

            public void setText(String text) {
                this.text = text;
            }

            public String getIsFold() {
                return isFold;
            }

            public void setIsFold(String isFold) {
                this.isFold = isFold;
            }

            public Value getValue() {
                return value;
            }

            public void setValue(Value value) {
                this.value = value;
            }

            @Override
            public String toString() {
                return "inputs:{" +
                        "key:'" + key + '\'' +
                        ", name:'" + name + '\'' +
                        ", type:'" + type + '\'' +
                        ", text:'" + text + '\'' +
                        ", isFold:'" + isFold + '\'' +
                        ", " + value +
                        '}';
            }
        }

        public static class Value {
            private String name;
            private String input;
            private String type;
            private String urlValueName;
            private String text;

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }

            public String getInput() {
                return input;
            }

            public void setInput(String input) {
                this.input = input;
            }

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public String getUrlValueName() {
                return urlValueName;
            }

            public void setUrlValueName(String urlValueName) {
                this.urlValueName = urlValueName;
            }

            public String getText() {
                return text;
            }

            public void setText(String text) {
                this.text = text;
            }

            @Override
            public String toString() {
                return "value:{" +
                        "name:'" + name + '\'' +
                        ", input:'" + input + '\'' +
                        ", type:'" + type + '\'' +
                        ", urlValueName:'" + urlValueName + '\'' +
                        ", text:'" + text + '\'' +
                        '}';
            }
        }

        public static class Output {
            private String key;
            private String name;
            private String isFold;
            private String text;
            private String type;

            @TableField(typeHandler = JacksonTypeHandler.class)
            private Value value;

            public Output() {}

            public Output(String key, String name, String isFold, String text, String type, Value value) {
                this.key = key;
                this.name = name;
                this.isFold = isFold;
                this.text = text;
                this.type = type;
                this.value = value;
            }

            public Output(HttpResponse<String> response) {}

            public String getKey() {
                return key;
            }

            public void setKey(String key) {
                this.key = key;
            }

            public String getName() {
                return name;
            }

            public void setName(String name) {
                this.name = name;
            }

            public String getIsFold() {
                return isFold;
            }

            public void setIsFold(String idFold) {
                this.isFold = isFold;
            }

            public String getText() {
                return text;
            }

            public void setText(String text) {
                this.text = text;
            }

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public Value getValue() {
                return value;
            }

            public void setValue(Value value) {
                this.value = value;
            }

            @Override
            public String toString() {
                return "outputs:{" +
                        "key:'" + key + '\'' +
                        ", name:'" + name + '\'' +
                        ", idFold:'" + isFold + '\'' +
                        ", text:'" + text + '\'' +
                        ", type:'" + type + '\'' +
                        ", " + value +
                        '}';
            }
        }
    }

    public static class Measured {
        private String width;
        private String height;

        public String getWidth() {
            return width;
        }

        public void setWidth(String width) {
            this.width = width;
        }

        public String getHeight() {
            return height;
        }

        public void setHeight(String height) {
            this.height = height;
        }

        @Override
        public String toString() {
            return "measured:{" +
                    "width:'" + width + '\'' +
                    ", height:'" + height + '\'' +
                    '}';
        }
    }
}